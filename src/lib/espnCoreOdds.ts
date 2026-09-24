/**
 * ESPN core-API odds client.
 *
 * `draftKingsApi.ts` is misleadingly named — it hits site.api.espn.com, the
 * scoreboard, which carries a single spread per game and nothing else. This
 * module adds the core API alongside it, without touching it:
 *
 *   sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}
 *     /events/{id}/competitions/{id}/odds              -> priced game lines
 *     /events/{id}/competitions/{id}/odds/{prov}/propBets -> player props
 *
 * ---------------------------------------------------------------------------
 * TWO THINGS ESTABLISHED BY MEASUREMENT, NOT ASSUMPTION
 *
 * 1. propBets carries no prices at all. 2,590 props sampled across four NFL
 *    games: zero contain an odds / american / over / under field. Every prop
 *    is {type, athlete $ref, current.target.value}.
 *
 * 2. 37% of props carry no value either — `current` is literally `{}`. That is
 *    every multi-candidate scorer market (First / Last / Anytime TD Scorer,
 *    2+ TDs, 3+ TDs, First Team TD) plus the quarter moneylines. They are
 *    lists of eligible athletes and nothing more, so they are unusable here —
 *    not because a 30-way market does not fit a two-option model, but because
 *    there is no data to put on the card or grade against.
 *
 * What is left, and what this module uses, is the 63% carrying a real target.
 * Milestones ("65+") are already binary and are the clean fit.
 * ---------------------------------------------------------------------------
 */

import type { Offering, Sport } from '../types';
import { formatLockET } from './timeFormat';
import { getPeriodWeekBounds } from './weekUtils';

const CORE = 'https://sports.core.api.espn.com/v2/sports';
const WEB = 'https://site.web.api.espn.com/apis/common/v3/sports';
const SITE = 'https://site.api.espn.com/apis/site/v2/sports';

/**
 * The core API needs a `/leagues/` segment that the site and web APIs do not:
 *
 *   site: /sports/baseball/mlb/scoreboard
 *   core: /sports/baseball/leagues/mlb/events/...
 *
 * Omitting it returns `{"error":{"message":"application error","code":404}}`
 * with a 404 — which `getJSON` swallows into null, so every league silently
 * produced zero offerings and nothing looked broken. Worth the helper.
 */
function corePath(path: string): string {
  const [sport, league] = path.split('/');
  return `${CORE}/${sport}/leagues/${league}`;
}

/** DraftKings. The odds node also lists Bet365 (2000) for some soccer. */
const DK_PROVIDER = 100;

const TIMEOUT_MS = 9000;

export interface LeagueRef {
  sport: Sport;
  league: string;
  path: string; // e.g. 'football/nfl'
}

/**
 * Leagues confirmed to return props same-day, in season.
 *
 * Verified 22 Sep 2026: NFL 657, MLB 694, EPL 813, UCL 764, WNBA 284, MLS 256.
 *
 * Deliberately absent:
 *  - college-football: 65 games that Saturday, DraftKings present on the game
 *    odds node, zero props on any of them. Game lines yes, player props no —
 *    a real coverage gap, not the calendar. It still yields moneyline/total
 *    below, which is why game lines and props are fetched separately.
 *  - NBA / NHL: unresolved. Their games right now are preseason and carry no
 *    odds node at all. Props populate as a game approaches (NFL five days out
 *    returned 205 vs 657 same-day), so a future-date probe cannot tell "no
 *    coverage" from "not priced yet". Retest same-day: NHL ~7 Oct, NBA ~21 Oct.
 */
export const PROP_LEAGUES: LeagueRef[] = [
  { sport: 'NFL', league: 'NFL', path: 'football/nfl' },
  { sport: 'MLB', league: 'MLB', path: 'baseball/mlb' },
];

/** Game lines are far more widely available than props — CFB included. */
export const LINE_LEAGUES: LeagueRef[] = [
  { sport: 'NFL', league: 'NFL', path: 'football/nfl' },
  { sport: 'MLB', league: 'MLB', path: 'baseball/mlb' },
  { sport: 'NFL', league: 'NCAAF', path: 'football/college-football' },
  { sport: 'WNBA', league: 'WNBA', path: 'basketball/wnba' },
  { sport: 'Soccer', league: 'EPL', path: 'soccer/eng.1' },
  { sport: 'Soccer', league: 'UCL', path: 'soccer/uefa.champions' },
  { sport: 'Soccer', league: 'MLS', path: 'soccer/usa.1' },
  { sport: 'NBA', league: 'NBA', path: 'basketball/nba' },
  { sport: 'NHL', league: 'NHL', path: 'hockey/nhl' },
];

/**
 * Milestone prop types mapped to their gamelog stat key.
 *
 * Only single-stat types are here. "Rushing + Receiving Yards Milestones" is
 * excluded because grading it means summing two columns, and a combined stat
 * makes the "cleared it in N of M" line harder to read than it is worth.
 * Defensive milestones (tackles, sacks, assists) are excluded because their
 * gamelog column names vary by position group.
 */
type StatMap = Record<string, { key: string; noun: string }>;

const MILESTONE_STATS: Record<string, StatMap> = {
  'football/nfl': {
    'Receiving Yards Milestones': { key: 'receivingYards', noun: 'receiving yards' },
    'Receptions Milestones': { key: 'receptions', noun: 'receptions' },
    'Rushing Yards Milestones': { key: 'rushingYards', noun: 'rushing yards' },
    'Rushing Attempts Milestones': { key: 'rushingAttempts', noun: 'carries' },
    'Passing Yards Milestones': { key: 'passingYards', noun: 'passing yards' },
    'Passing Touchdown Milestones': { key: 'passingTouchdowns', noun: 'passing TDs' },
    'Passing Completions Milestones': { key: 'passingCompletions', noun: 'completions' },
  },
  // 'Total Bases' and 'Singles' are excluded: neither is a gamelog column, so
  // grading them means deriving from doubles/triples/homeRuns and the "N of M"
  // line stops being checkable against anything the player can look up.
  'baseball/mlb': {
    'Hits Milestones': { key: 'hits', noun: 'hits' },
    'RBIs Milestones': { key: 'RBIs', noun: 'RBIs' },
    'Runs Milestones': { key: 'runs', noun: 'runs' },
    'Home Runs Milestones': { key: 'homeRuns', noun: 'home runs' },
    'Stolen Bases Milestones': { key: 'stolenBases', noun: 'stolen bases' },
    'Strikeouts (Batter) Milestones': { key: 'strikeouts', noun: 'strikeouts' },
  },
  'basketball/wnba': {
    'Points Milestones': { key: 'points', noun: 'points' },
    'Rebounds Milestones': { key: 'totalRebounds', noun: 'rebounds' },
    'Assists Milestones': { key: 'assists', noun: 'assists' },
    'Steals Milestones': { key: 'steals', noun: 'steals' },
    'Blocks Milestones': { key: 'blocks', noun: 'blocks' },
    '3-Point Field Goals Milestones': {
      key: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
      noun: 'threes',
    },
  },
};

/**
 * Fallback probability when a player has too little game log to measure.
 *
 * It is week 3 — plenty of players have two or three games, and "2 of 3" is
 * noise dressed as data. Below MIN_GAMES the card falls back to this and says
 * so rather than quoting a rate it cannot support.
 */
const MIN_GAMES = 4;
const MILESTONE_PRIOR = 0.5;

/**
 * What a game's total is actually counting.
 *
 * The over/under card said "total points" for every sport, which is wrong
 * anywhere that does not score in points — an MLB card read "Rays @ Yankees
 * — total points" over a line of 7, which is runs. Sport-agnostic wording
 * was the bug, so this is keyed by league rather than special-cased for MLB.
 */
const TOTAL_NOUN: Record<string, string> = {
  'baseball/mlb': 'runs',
  'hockey/nhl': 'goals',
  'soccer/eng.1': 'goals',
  'soccer/uefa.champions': 'goals',
  'soccer/usa.1': 'goals',
};
const DEFAULT_TOTAL_NOUN = 'points';

// ---------------------------------------------------------------------------
// fetch plumbing
// ---------------------------------------------------------------------------

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url.replace('http://', 'https://'), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Bounded parallelism — a full NFL slate is ~400 usable props per game. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

function americanToProb(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

function fmtAmerican(n: number | undefined): string | undefined {
  if (n == null || Number.isNaN(n)) return undefined;
  return n > 0 ? `+${n}` : `${n}`;
}


// ---------------------------------------------------------------------------
// today's events
// ---------------------------------------------------------------------------

interface SiteEvent {
  id: string;
  shortName?: string;
  competitions: {
    id: string;
    startDate: string;
    status?: { type?: { completed?: boolean } };
    competitors: {
      homeAway?: string;
      score?: string;
      winner?: boolean;
      team: { abbreviation: string; displayName: string; shortDisplayName: string; logo?: string; color?: string };
    }[];
  }[];
}

/**
 * Upcoming events within a short horizon.
 *
 * Deliberately NOT `?dates=<today>`, which is what draftKingsApi.ts uses.
 * That parameter means "games kicking off on this calendar date", and on a
 * Tuesday the NFL has none — so a same-day query returns zero NFL events and
 * therefore zero NFL props, on the league with the best prop coverage of all.
 * The bare scoreboard returns the current slate instead.
 *
 * The horizon is capped because Streak is one-pick-at-a-time: a question that
 * locks five days out would tie up the player's only active pick for five
 * days. Two days keeps Thursday night reachable on a Tuesday without parking
 * anyone on a pick for a week.
 */
/**
 * How far ahead to fetch.
 *
 * Was 72h, chosen to reach Thursday night football without tying up the
 * player's single active pick on a game a week out. The day nav changes that
 * calculation: it shows a full Tue->Mon week, so a day with no questions in
 * it is a hole in the product rather than a considered limit. Fetch the week.
 */
const HORIZON_HOURS = 24 * 8;

function yyyymmdd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

async function upcomingEvents(league: LeagueRef): Promise<SiteEvent[]> {
  const now = Date.now();
  const until = now + HORIZON_HOURS * 3600_000;

  /*
   * Queried one date at a time rather than as a range.
   *
   * The bare scoreboard returns the CURRENT week, which mid-week for the NFL
   * is a set of finished games — so it yields nothing upcoming on the league
   * with the best prop coverage. `?dates=A-B` range syntax returns no `events`
   * key at all. Single dates work, so the next few days are fetched
   * individually and merged.
   *
   * Three days is the horizon because Streak is one-pick-at-a-time: it reaches
   * Thursday night football from a Tuesday without letting someone tie up
   * their only active pick on a game a week out.
   */
  /*
   * The window covers the WHOLE period week, not just what is ahead.
   *
   * Selecting Tuesday on a Wednesday used to show an empty board, because
   * both the day query and the filter started at "now". But a past day is not
   * empty — it is the day you already played, and the whole point of being
   * able to tap back to it is seeing how those picks landed. So finished
   * games are fetched too and surface as locked cards.
   */
  const weekStart = getPeriodWeekBounds(new Date(now)).start.getTime();
  const firstDay = Math.min(weekStart, now);
  const dayCount = Math.ceil((until - firstDay) / 86400_000) + 1;

  const days = Array.from({ length: Math.min(dayCount, 10) }, (_, n) =>
    yyyymmdd(new Date(firstDay + n * 86400_000))
  );
  const pages = await Promise.all(
    days.map((d) => getJSON<{ events?: SiteEvent[] }>(`${SITE}/${league.path}/scoreboard?dates=${d}`))
  );

  const byId = new Map<string, SiteEvent>();
  for (const p of pages) for (const e of p?.events ?? []) byId.set(e.id, e);

  return [...byId.values()]
    .filter((e) => {
      const c = e.competitions?.[0];
      // Note: completed games are deliberately NOT filtered out.
      if (!c || !(c.competitors?.length >= 2)) return false;
      const t = new Date(c.startDate).getTime();
      return t >= weekStart && t <= until;
    })
    .sort((a, b) => +new Date(a.competitions[0].startDate) - +new Date(b.competitions[0].startDate));
}

// ---------------------------------------------------------------------------
// priced game lines -> moneyline + total offerings
// ---------------------------------------------------------------------------

interface OddsNode {
  overUnder?: number;
  overOdds?: number;
  underOdds?: number;
  awayTeamOdds?: { moneyLine?: number };
  homeTeamOdds?: { moneyLine?: number };
}

function teamOf(ev: SiteEvent, side: 'home' | 'away') {
  const c = ev.competitions[0];
  const found = c.competitors.find((x) => x.homeAway === side);
  return (found ?? (side === 'away' ? c.competitors[1] : c.competitors[0])).team;
}

/**
 * Which side actually won, for a game that has finished.
 *
 * Only computed for completed games — a live or scheduled game has no answer
 * and must not pretend to. `winner` is what the scoreboard sets once final;
 * totals are settled against the combined score.
 */
function isFinal(ev: SiteEvent): boolean {
  return ev.competitions[0]?.status?.type?.completed === true;
}

function competitorOf(ev: SiteEvent, side: 'home' | 'away') {
  const c = ev.competitions[0];
  return c.competitors.find((x) => x.homeAway === side) ?? (side === 'away' ? c.competitors[1] : c.competitors[0]);
}

function darkLogo(url?: string) {
  return url ? url.replace('/500/', '/500-dark/') : undefined;
}

function buildLineOfferings(ev: SiteEvent, odds: OddsNode, lg: LeagueRef): Offering[] {
  const comp = ev.competitions[0];
  const away = teamOf(ev, 'away');
  const home = teamOf(ev, 'home');
  const out: Offering[] = [];

  const base = {
    sport: lg.sport,
    league: lg.league,
    startTime: formatLockET(comp.startDate),
    startTimeISO: comp.startDate,
  };

  // Moneyline — straight-up winner, priced on both sides.
  const mlA = odds.awayTeamOdds?.moneyLine;
  const mlB = odds.homeTeamOdds?.moneyLine;
  if (mlA != null && mlB != null) {
    out.push({
      ...base,
      id: `ml-${ev.id}`,
      kind: 'moneyline',
      question: `Who wins? ${away.shortDisplayName} @ ${home.shortDisplayName}`,
      optionA: away.displayName,
      optionB: home.displayName,
      shortA: away.shortDisplayName,
      shortB: home.shortDisplayName,
      abbrA: away.abbreviation,
      abbrB: home.abbreviation,
      imageA: darkLogo(away.logo),
      imageB: darkLogo(home.logo),
      colorA: away.color ? `#${away.color}` : '#333333',
      colorB: home.color ? `#${home.color}` : '#333333',
      oddsA: fmtAmerican(mlA),
      oddsB: fmtAmerican(mlB),
      winProbA: americanToProb(mlA),
      pickPctA: 50,
      pickPctB: 50,
      resolution: { espnPath: lg.path, eventId: ev.id, competitionId: comp.id },
      // A = away, B = home (see optionA/optionB above)
      correctSide: isFinal(ev)
        ? competitorOf(ev, 'away').winner
          ? 'A'
          : competitorOf(ev, 'home').winner
          ? 'B'
          : undefined
        : undefined,
    });
  }

  // Total — over/under on combined points. Priced on both sides, and the
  // cheapest new question type in the whole API: same fetch, no new plumbing.
  if (odds.overUnder != null) {
    const over = odds.overOdds ?? -110;
    const under = odds.underOdds ?? -110;
    out.push({
      ...base,
      id: `tot-${ev.id}`,
      kind: 'total',
      question: `${away.shortDisplayName} @ ${home.shortDisplayName} — total ${TOTAL_NOUN[lg.path] ?? DEFAULT_TOTAL_NOUN}`,
      optionA: `Over ${odds.overUnder}`,
      optionB: `Under ${odds.overUnder}`,
      shortA: `Over ${odds.overUnder}`,
      shortB: `Under ${odds.overUnder}`,
      abbrA: `O ${odds.overUnder}`,
      abbrB: `U ${odds.overUnder}`,
      colorA: away.color ? `#${away.color}` : '#333333',
      colorB: home.color ? `#${home.color}` : '#333333',
      oddsA: fmtAmerican(over),
      oddsB: fmtAmerican(under),
      winProbA: americanToProb(over),
      pickPctA: 50,
      pickPctB: 50,
      noSideArt: true,
      resolution: { espnPath: lg.path, eventId: ev.id, competitionId: comp.id, line: odds.overUnder },
      correctSide: (() => {
        if (!isFinal(ev)) return undefined;
        const a = Number(competitorOf(ev, 'away').score);
        const h = Number(competitorOf(ev, 'home').score);
        if (Number.isNaN(a) || Number.isNaN(h)) return undefined;
        const total = a + h;
        // A push (exact line) has no winning side, so leave it unset.
        if (total === odds.overUnder) return undefined;
        return total > odds.overUnder! ? 'A' : 'B';
      })(),
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// milestone props -> yes/no offerings with a measured hit rate
// ---------------------------------------------------------------------------

interface PropItem {
  athlete?: { $ref: string };
  type?: { id: string; name: string };
  current?: { target?: { value: number; displayValue: string } };
}

const athleteCache = new Map<string, { name: string; short: string; headshot?: string } | null>();
const gameLogCache = new Map<string, { vals: number[]; perEvent: Map<string, number> } | null>();

/**
 * The steepest a milestone is allowed to be, expressed as American odds.
 *
 * -300 implies a 75% win probability. DraftKings' propBets feed carries no
 * price at all (see the module comment), so this is checked against the
 * measured hit rate instead — the same number the card already shows as
 * "N of M games". Below this, a "150+ passing yards" line for a starting QB
 * clears in essentially every game, which is a free win dressed as a pick.
 */
const MAX_HIT_RATE = 0.75;

/**
 * Parse one game log cell.
 *
 * Most are plain numbers. Shooting columns are "made-attempted" ("3-7"), and
 * a milestone on threes is asking about makes, so the left side is taken.
 * Blank cells arrive as "-" and mean the player did not record the stat.
 */
function parseStat(raw: string | undefined): number | null {
  if (raw == null || raw === '-' || raw === '') return null;
  const first = raw.includes('-') && !raw.startsWith('-') ? raw.split('-')[0] : raw;
  const n = Number(first);
  return Number.isNaN(n) ? null : n;
}

async function resolveAthlete(ref: string) {
  if (athleteCache.has(ref)) return athleteCache.get(ref)!;
  const a = await getJSON<{ displayName?: string; shortName?: string; headshot?: { href?: string } }>(ref);
  const val = a?.displayName
    ? { name: a.displayName, short: a.shortName ?? a.displayName, headshot: a.headshot?.href }
    : null;
  athleteCache.set(ref, val);
  return val;
}

/**
 * This player's season game log for one stat, as raw per-game values.
 *
 * Pulls every game once and caches it unkeyed by target, so picking the
 * right rung off a 25-step ladder (150, 160, 170… 390 passing yards) costs
 * one fetch instead of one per rung. Where a price would have encoded
 * difficulty, this states it directly — the number the card shows is the
 * number the resolver settles against.
 *
 * Current season is usually a small sample this early, so the previous
 * season is appended when needed.
 */
async function fetchGameLog(sportPath: string, athleteId: string, statKey: string) {
  const cacheKey = `${athleteId}|${statKey}`;
  if (gameLogCache.has(cacheKey)) return gameLogCache.get(cacheKey)!;

  const season = new Date().getFullYear();
  const perEvent = new Map<string, number>();
  const collect = async (yr?: number) => {
    const url = `${WEB}/${sportPath}/athletes/${athleteId}/gamelog${yr ? `?season=${yr}` : ''}`;
    const g = await getJSON<{
      names?: string[];
      seasonTypes?: { categories?: { events?: { eventId: string; stats: string[] }[] }[] }[];
    }>(url);
    if (!g?.names) return [] as number[];
    const idx = g.names.indexOf(statKey);
    if (idx < 0) return [] as number[];
    const vals: number[] = [];
    for (const st of g.seasonTypes ?? [])
      for (const cat of st.categories ?? [])
        for (const e of cat.events ?? []) {
          const n = parseStat(e.stats?.[idx]);
          if (n != null) {
            vals.push(n);
            // Keyed by event so a finished prop can be settled against what
            // the player actually did in THAT game, rather than guessed at.
            perEvent.set(e.eventId, n);
          }
        }
    return vals;
  };

  let vals = await collect();
  if (vals.length < MIN_GAMES) vals = vals.concat(await collect(season - 1));

  const val = vals.length ? { vals, perEvent } : null;
  gameLogCache.set(cacheKey, val);
  return val;
}

function hitRateAt(vals: number[], target: number) {
  return { hit: vals.filter((v) => v >= target).length, of: vals.length };
}

async function buildMilestoneOfferings(
  ev: SiteEvent,
  lg: LeagueRef,
  perGame: number,
  rotation: number
): Promise<Offering[]> {
  const comp = ev.competitions[0];
  const data = await getJSON<{ items?: PropItem[] }>(
    `${corePath(lg.path)}/events/${ev.id}/competitions/${comp.id}/odds/${DK_PROVIDER}/propBets?limit=1000`
  );
  if (!data?.items?.length) return [];

  // Keep only milestone types that carry a target and map to one gamelog stat.
  const statMap = MILESTONE_STATS[lg.path] ?? {};
  const usable = data.items.filter(
    (p) => p.athlete?.$ref && p.type && statMap[p.type.name] && p.current?.target?.value != null
  );
  if (!usable.length) return [];

  /*
   * One prop per TYPE per game, then sweep for variety.
   *
   * Deduping by athlete alone was not enough: a single MLB game offers "1+
   * hits" for its whole lineup, so the board filled with four separate
   * "[player] 1+ hits?" cards from the same game, all locking at the same
   * minute. Same question, same moment, four times.
   *
   * So the unit of variety is the prop TYPE, and each game contributes at
   * most one of each. The type order is then rotated per game, so the first
   * type is not always "Hits" — otherwise every game leads with whatever
   * happens to sort first and the board is varied within a game but
   * monotonous across them.
   *
   * Grouped one level deeper than before: type -> athlete -> the athlete's
   * full ladder of rungs for that type. DraftKings' propBets feed returns
   * EVERY round-number threshold ("150+", "160+", ... "390+" passing yards)
   * as its own untyped, unpriced item, not just the one DK actually prices
   * as its current line. Picking the first one encountered — the old
   * behaviour — meant whichever rung happened to sort first, which was
   * usually the easiest: a 150+ passing yard prop for a starting QB clears
   * in nearly every game. The ladder is kept intact here so a rung can be
   * chosen deliberately below.
   */
  const byType = new Map<string, Map<string, PropItem[]>>();
  for (const p of usable) {
    const t = p.type!.name;
    const a = p.athlete!.$ref;
    if (!byType.has(t)) byType.set(t, new Map());
    const byAthlete = byType.get(t)!;
    if (!byAthlete.has(a)) byAthlete.set(a, []);
    byAthlete.get(a)!.push(p);
  }

  const types = [...byType.keys()].sort();
  const offset = rotation % Math.max(1, types.length);
  const rotated = [...types.slice(offset), ...types.slice(0, offset)];

  const usedAthletes = new Set<string>();
  const picked: { type: string; ladder: PropItem[] }[] = [];
  for (const t of rotated) {
    if (picked.length >= perGame) break;
    // Within a type, prefer a player this game has not already asked about.
    const byAthlete = byType.get(t)!;
    const athleteRefs = [...byAthlete.keys()];
    const chosenRef = athleteRefs.find((r) => !usedAthletes.has(r)) ?? athleteRefs[0];
    usedAthletes.add(chosenRef);
    picked.push({ type: t, ladder: byAthlete.get(chosenRef)! });
  }

  const away = teamOf(ev, 'away');
  const home = teamOf(ev, 'home');
  const gameLabel = `${away.shortDisplayName} @ ${home.shortDisplayName}`;

  const built = await mapLimit(picked, 4, async ({ type, ladder }) => {
    const meta = statMap[type];
    const athleteRef = ladder[0].athlete!.$ref;
    const athleteId = athleteRef.split('/athletes/')[1]?.split('?')[0];
    if (!athleteId) return null;

    const [who, log] = await Promise.all([
      resolveAthlete(athleteRef),
      fetchGameLog(lg.path, athleteId, meta.key),
    ]);
    if (!who) return null;

    const enough = log != null && log.vals.length >= MIN_GAMES;

    /*
     * Walk the ladder easiest -> hardest, stop at the first rung whose
     * measured hit rate is at or under the -300 cap.
     *
     * That is the LEAST easy line that still respects the boundary, which
     * keeps it close to what a real book would price rather than jumping
     * straight to the hardest number on the sheet. If this player clears
     * even the hardest rung more than 75% of the time, there is no rung
     * that satisfies the cap — fall back to the hardest available, since
     * that is the closest this ladder gets.
     */
    const sorted = [...ladder].sort(
      (a, b) => a.current!.target!.value - b.current!.target!.value
    );
    let chosen = sorted[sorted.length - 1];
    if (enough) {
      for (const rung of sorted) {
        const { hit, of } = hitRateAt(log!.vals, rung.current!.target!.value);
        if (hit / of <= MAX_HIT_RATE) {
          chosen = rung;
          break;
        }
      }
    } else {
      // No usable sample yet — the middle of the ladder is a safer default
      // than either end until there is data to pick deliberately.
      chosen = sorted[Math.floor(sorted.length / 2)];
    }

    const target = chosen.current!.target!.value;
    const rate = enough ? hitRateAt(log!.vals, target) : null;
    const prob = rate ? rate.hit / rate.of : MILESTONE_PRIOR;
    const stat = rate ? `${rate.hit} of ${rate.of} games` : 'not enough games yet';

    const o: Offering = {
      id: `ms-${ev.id}-${athleteId}-${chosen.type!.id}-${target}`,
      sport: lg.sport,
      league: lg.league,
      kind: 'milestone',
      question: `${who.name} — ${target}+ ${meta.noun}?`,
      gameLabel,
      optionA: 'Yes',
      optionB: 'No',
      shortA: 'Yes',
      shortB: 'No',
      abbrA: 'Y',
      abbrB: 'N',
      colorA: away.color ? `#${away.color}` : '#333333',
      colorB: home.color ? `#${home.color}` : '#333333',
      heroImage: who.headshot,
      // No oddsA/oddsB on purpose: the feed has no price to put here, and an
      // invented one would be worse than none.
      winProbA: prob,
      statA: stat,
      statB: rate ? `missed in ${rate.of - rate.hit}` : 'not enough games yet',
      pickPctA: Math.round(prob * 100),
      pickPctB: 100 - Math.round(prob * 100),
      startTime: formatLockET(comp.startDate),
      startTimeISO: comp.startDate,
      noSideArt: true,
      resolution: {
        espnPath: lg.path,
        eventId: ev.id,
        competitionId: comp.id,
        athleteId,
        statKey: meta.key,
        target,
      },
      // Settled exactly: what this player actually recorded in THIS game,
      // against the number the question asked about. A = Yes, B = No.
      correctSide: (() => {
        if (!isFinal(ev)) return undefined;
        const actual = log?.perEvent.get(ev.id);
        if (actual == null) return undefined;
        return actual >= target ? 'A' : 'B';
      })(),
    };
    return o;
  });

  return built.filter((x): x is Offering => x !== null);
}

// ---------------------------------------------------------------------------
// public entry point
// ---------------------------------------------------------------------------

export interface CoreOddsOptions {
  /** Games per league to pull game lines from. */
  gamesPerLeague?: number;
  /** Games per league to pull props from — props are the expensive path. */
  propGamesPerLeague?: number;
  /** Milestone questions per game. */
  milestonesPerGame?: number;
}

/**
 * Everything the core API can add on top of the existing scoreboard spreads.
 *
 * Every layer is failure-tolerant: a league that returns nothing, a game with
 * no odds node, an athlete that will not resolve, a game log with no matching
 * column — each drops out quietly and the rest still ship. A slate that is
 * partly there beats an error state.
 */
export async function fetchCoreOfferings(opts: CoreOddsOptions = {}): Promise<Offering[]> {
  const { gamesPerLeague = 4, propGamesPerLeague = 2, milestonesPerGame = 3 } = opts;

  const lineWork = LINE_LEAGUES.map(async (lg) => {
    const events = (await upcomingEvents(lg)).slice(0, gamesPerLeague);
    const perEvent = await mapLimit(events, 4, async (ev) => {
      const node = await getJSON<{ items?: (OddsNode & { provider?: { id?: string } })[] }>(
        `${corePath(lg.path)}/events/${ev.id}/competitions/${ev.competitions[0].id}/odds`
      );
      const dk = node?.items?.find((i) => String(i.provider?.id) === String(DK_PROVIDER)) ?? node?.items?.[0];
      return dk ? buildLineOfferings(ev, dk, lg) : [];
    });
    return perEvent.flat();
  });

  const propWork = PROP_LEAGUES.map(async (lg) => {
    const events = (await upcomingEvents(lg)).slice(0, propGamesPerLeague);
    const perEvent = await mapLimit(events, 2, (ev) =>
      buildMilestoneOfferings(ev, lg, milestonesPerGame, events.indexOf(ev))
    );
    return perEvent.flat();
  });

  const settled = await Promise.allSettled([...lineWork, ...propWork]);
  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
