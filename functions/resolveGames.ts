/**
 * Cloud Function: resolveGames
 *
 * Grades pending picks against real results, every 10 minutes.
 * Deploy with: firebase deploy --only functions
 *
 * ---------------------------------------------------------------------------
 * WHY THIS WAS REWRITTEN
 *
 * The previous version could not resolve anything, for three reasons:
 *
 *  1. It inferred the sport from the offering id: `id.split('-')[0]`. Ids are
 *     `ml-401873648`, `tot-…`, `ms-…`, `espn-…`, so that yielded "ML", "TOT",
 *     "MS" — none of which are in SPORT_PATHS. The sport set came out empty,
 *     no scoreboards were fetched, and the function logged success having
 *     graded nothing.
 *
 *  2. It matched picks to games by substring: it took the LAST WORD of the
 *     chosen option and looked for it inside a team name. For "Over 6.5" that
 *     word is "6.5". For a Yes/No prop it is "yes".
 *
 *  3. Even with those fixed it could only ever have graded moneylines. A pick
 *     document holds offeringId, side, chosenOption and odds — there is no
 *     line on it to settle a total against, and no player or stat to settle a
 *     prop against. The question was not recoverable from the answer.
 *
 * So picks now carry their own resolution inputs (Offering.resolution, written
 * to `offerings/{id}` when the pick is made) and this function grades each
 * kind explicitly against the same sources the client used to build it.
 * ------------------------------------------------------------------------ */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports';

/** Picks older than this are abandoned rather than retried forever. */
const STALE_AFTER_HOURS = 72;

type Kind = 'spread' | 'moneyline' | 'total' | 'milestone';
type Side = 'A' | 'B';

interface Resolution {
  espnPath: string;
  eventId: string;
  competitionId: string;
  line?: number;
  athleteId?: string;
  statKey?: string;
  target?: number;
}

interface OfferingDoc {
  kind: Kind;
  optionA: string;
  optionB: string;
  resolution: Resolution;
}

interface PickDoc {
  uid: string;
  offeringId: string;
  side: Side;
  chosenOption: string;
  status: string;
  createdAt?: admin.firestore.Timestamp;
}

// ---------------------------------------------------------------------------

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    functions.logger.warn(`fetch failed: ${url}`, err);
    return null;
  }
}

interface Competitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
}
interface ScoreEvent {
  id: string;
  competitions: { status?: { type?: { completed?: boolean } }; competitors: Competitor[] }[];
}

/** One scoreboard fetch per league, reused across every pick in that league. */
async function loadScoreboard(espnPath: string): Promise<Map<string, ScoreEvent>> {
  const byId = new Map<string, ScoreEvent>();
  // A few days back so a finished game is still on the board when we look.
  for (let d = 0; d <= 3; d++) {
    const t = new Date(Date.now() - d * 86_400_000);
    const date = `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, '0')}${String(
      t.getUTCDate()
    ).padStart(2, '0')}`;
    const page = await getJSON<{ events?: ScoreEvent[] }>(`${SITE}/${espnPath}/scoreboard?dates=${date}`);
    for (const e of page?.events ?? []) byId.set(e.id, e);
  }
  return byId;
}

function sideOf(ev: ScoreEvent, which: 'home' | 'away'): Competitor | undefined {
  const c = ev.competitions[0];
  return c?.competitors.find((x) => x.homeAway === which) ?? (which === 'away' ? c?.competitors[1] : c?.competitors[0]);
}

function isFinal(ev: ScoreEvent | undefined): boolean {
  return ev?.competitions?.[0]?.status?.type?.completed === true;
}

function parseStat(raw: string | undefined): number | null {
  if (raw == null || raw === '-' || raw === '') return null;
  // Shooting columns arrive as "made-attempted"; a milestone asks about makes.
  const first = raw.includes('-') && !raw.startsWith('-') ? raw.split('-')[0] : raw;
  const n = Number(first);
  return Number.isNaN(n) ? null : n;
}

/** What a player actually recorded in one specific game. */
async function statInGame(
  espnPath: string,
  athleteId: string,
  statKey: string,
  eventId: string
): Promise<number | null> {
  const g = await getJSON<{
    names?: string[];
    seasonTypes?: { categories?: { events?: { eventId: string; stats: string[] }[] }[] }[];
  }>(`${WEB}/${espnPath}/athletes/${athleteId}/gamelog`);
  const idx = g?.names?.indexOf(statKey) ?? -1;
  if (!g?.names || idx < 0) return null;
  for (const st of g.seasonTypes ?? [])
    for (const cat of st.categories ?? [])
      for (const e of cat.events ?? []) if (e.eventId === eventId) return parseStat(e.stats?.[idx]);
  return null;
}

/**
 * Which side won. `null` means not yet knowable; 'push' means neither.
 *
 * Mirrors the client's `correctSide` logic deliberately — the board and the
 * ledger must agree on what happened, and two implementations of a grading
 * rule is how they stop agreeing.
 */
async function settle(
  off: OfferingDoc,
  board: Map<string, ScoreEvent>
): Promise<Side | 'push' | null> {
  const r = off.resolution;
  const ev = board.get(r.eventId);
  if (!isFinal(ev) || !ev) return null;

  if (off.kind === 'moneyline' || off.kind === 'spread') {
    // A = away, B = home
    if (sideOf(ev, 'away')?.winner) return 'A';
    if (sideOf(ev, 'home')?.winner) return 'B';
    return 'push';
  }

  if (off.kind === 'total') {
    if (r.line == null) return null;
    const a = Number(sideOf(ev, 'away')?.score);
    const h = Number(sideOf(ev, 'home')?.score);
    if (Number.isNaN(a) || Number.isNaN(h)) return null;
    const total = a + h;
    if (total === r.line) return 'push';
    return total > r.line ? 'A' : 'B';
  }

  if (off.kind === 'milestone') {
    if (!r.athleteId || !r.statKey || r.target == null) return null;
    const actual = await statInGame(r.espnPath, r.athleteId, r.statKey, r.eventId);
    // A player who did not appear recorded zero, but a missing game log is
    // not the same as a zero — leave it unresolved rather than grading a
    // "No" off an absent row.
    if (actual == null) return null;
    return actual >= r.target ? 'A' : 'B';
  }

  return null;
}

// ---------------------------------------------------------------------------

async function resolvePending(): Promise<{ resolved: number; voided: number; skipped: number }> {
  const pending = await db.collection('picks').where('status', '==', 'pending').get();
  if (pending.empty) return { resolved: 0, voided: 0, skipped: 0 };

  const picks = pending.docs.map((d) => ({ id: d.id, ...(d.data() as PickDoc) }));

  // Load each referenced offering once.
  const offeringIds = [...new Set(picks.map((p) => p.offeringId))];
  const offerings = new Map<string, OfferingDoc>();
  for (let i = 0; i < offeringIds.length; i += 10) {
    const chunk = offeringIds.slice(i, i + 10);
    const snaps = await db.getAll(...chunk.map((id) => db.collection('offerings').doc(id)));
    snaps.forEach((s) => {
      if (s.exists) offerings.set(s.id, s.data() as OfferingDoc);
    });
  }

  // One scoreboard per league, not one per pick.
  const paths = [...new Set([...offerings.values()].map((o) => o.resolution?.espnPath).filter(Boolean))] as string[];
  const boards = new Map<string, Map<string, ScoreEvent>>();
  for (const p of paths) boards.set(p, await loadScoreboard(p));

  const batch = db.batch();
  let resolved = 0;
  let voided = 0;
  let skipped = 0;
  const staleBefore = Date.now() - STALE_AFTER_HOURS * 3_600_000;

  for (const pick of picks) {
    const off = offerings.get(pick.offeringId);
    if (!off?.resolution) {
      skipped++;
      continue;
    }

    const outcome = await settle(off, boards.get(off.resolution.espnPath) ?? new Map());

    if (outcome === null) {
      // Give up on picks whose game should long since have finished, rather
      // than re-fetching them on every run forever.
      const created = pick.createdAt?.toMillis?.() ?? Date.now();
      if (created < staleBefore) {
        batch.update(db.collection('picks').doc(pick.id), {
          status: 'void',
          resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
          voidReason: 'unresolved past cutoff',
        });
        voided++;
      } else {
        skipped++;
      }
      continue;
    }

    const pickRef = db.collection('picks').doc(pick.id);
    const userRef = db.collection('users').doc(pick.uid);

    if (outcome === 'push') {
      // Neither side won. Void it and leave the streak untouched — a push
      // should not break a run the player never actually lost.
      batch.update(pickRef, {
        status: 'void',
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        voidReason: 'push',
      });
      voided++;
      continue;
    }

    const won = outcome === pick.side;
    batch.update(pickRef, {
      status: won ? 'won' : 'lost',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.update(
      userRef,
      won
        ? {
            weeklyWins: admin.firestore.FieldValue.increment(1),
            allTimeWins: admin.firestore.FieldValue.increment(1),
            weeklyStreak: admin.firestore.FieldValue.increment(1),
          }
        : { weeklyStreak: 0 }
    );
    resolved++;
  }

  if (resolved + voided > 0) await batch.commit();
  return { resolved, voided, skipped };
}

export const resolveGames = functions.pubsub.schedule('every 10 minutes').onRun(async () => {
  const out = await resolvePending();
  functions.logger.info('resolveGames', out);
  return null;
});

/**
 * Manual trigger, for verifying a deployment without waiting for the schedule.
 * Actually runs the resolver — the previous version returned a stub message,
 * which made it useless for the one job it had.
 */
export const resolveGamesHttp = functions.https.onRequest(async (_req, res) => {
  try {
    const out = await resolvePending();
    functions.logger.info('resolveGamesHttp', out);
    res.json({ ok: true, ...out });
  } catch (err) {
    functions.logger.error('resolveGamesHttp failed', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});
