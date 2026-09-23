import type { Offering, Sport } from '../types';
import { offlineOfferings } from '../data/offlineSnapshot';
import { fetchCoreOfferings } from './espnCoreOdds';
import { formatLockET } from './timeFormat';

/*
 * Fallback when every network path fails.
 *
 * Was `data/offerings.ts` — twelve hand-written rows, all spreads. That made
 * an offline app look like one that had lost its new question types rather
 * than one that had lost its network. The snapshot is real captured data
 * covering all three, with artwork inlined, so the degraded state still
 * represents the product.
 */
const staticOfferings = offlineOfferings;

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const SPORT_PATHS: { sport: Sport; league: string; path: string }[] = [
  { sport: 'NFL', league: 'NFL', path: 'football/nfl' },
  { sport: 'NBA', league: 'NBA', path: 'basketball/nba' },
  { sport: 'MLB', league: 'MLB', path: 'baseball/mlb' },
  { sport: 'NHL', league: 'NHL', path: 'hockey/nhl' },
  { sport: 'WNBA', league: 'WNBA', path: 'basketball/wnba' },
  { sport: 'Soccer', league: 'EPL', path: 'soccer/eng.1' },
  { sport: 'Soccer', league: 'Champions League', path: 'soccer/uefa.champions' },
  { sport: 'Soccer', league: 'MLS', path: 'soccer/usa.1' },
  { sport: 'Soccer', league: 'La Liga', path: 'soccer/esp.1' },
  { sport: 'Soccer', league: 'Bundesliga', path: 'soccer/ger.1' },
];

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface ESPNCompetitor {
  team: {
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    logo: string;
    color?: string;
  };
  winner?: boolean;
  score?: string;
}

interface ESPNCompetition {
  id: string;
  status: { type: { completed: boolean; description: string; shortDetail: string } };
  competitors: ESPNCompetitor[];
  odds?: { pointSpread?: { home?: { close?: { line?: string; odds?: string } }; away?: { close?: { line?: string; odds?: string } } }; moneyline?: { home?: { close?: { odds?: string } }; away?: { close?: { odds?: string } } } }[];
  startDate: string;
}

interface ESPNEvent {
  id: string;
  name: string;
  competitions: ESPNCompetition[];
}

interface ESPNScoreboard {
  events: ESPNEvent[];
}


function toDarkLogo(url: string): string {
  return url.replace('/500/', '/500-dark/');
}

function mapESPNToOffering(event: ESPNEvent, sport: Sport, league: string): Offering | null {
  const comp = event.competitions[0];
  if (!comp || comp.competitors.length < 2) return null;
  if (comp.status.type.completed) return null;

  const gameDate = new Date(comp.startDate);
  const now = new Date();
  if (
    gameDate.getFullYear() !== now.getFullYear() ||
    gameDate.getMonth() !== now.getMonth() ||
    gameDate.getDate() !== now.getDate()
  ) {
    return null;
  }

  const odds = comp.odds?.[0];
  if (!odds) return null;

  const home = comp.competitors[0];
  const away = comp.competitors[1];

  const homeSpread = odds?.pointSpread?.home?.close;
  const awaySpread = odds?.pointSpread?.away?.close;

  const pickPctA = Math.floor(35 + Math.random() * 30);

  return {
    id: `espn-${event.id}`,
    sport,
    league,
    kind: 'spread',
    question: 'Pick against the spread!',
    optionA: away.team.displayName,
    optionB: home.team.displayName,
    shortA: away.team.shortDisplayName,
    shortB: home.team.shortDisplayName,
    abbrA: away.team.abbreviation,
    abbrB: home.team.abbreviation,
    imageA: toDarkLogo(away.team.logo),
    imageB: toDarkLogo(home.team.logo),
    colorA: away.team.color ? `#${away.team.color}` : '#333333',
    colorB: home.team.color ? `#${home.team.color}` : '#333333',
    oddsA: awaySpread ? `${awaySpread.line} (${awaySpread.odds})` : undefined,
    oddsB: homeSpread ? `${homeSpread.line} (${homeSpread.odds})` : undefined,
    pickPctA,
    pickPctB: 100 - pickPctA,
    startTime: formatLockET(comp.startDate),
    startTimeISO: comp.startDate,
  };
}

async function fetchSportOfferings(sportConfig: typeof SPORT_PATHS[0]): Promise<Offering[]> {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const url = `${ESPN_BASE}/${sportConfig.path}/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data: ESPNScoreboard = await res.json();
    const offerings: Offering[] = [];
    for (const event of data.events) {
      const offering = mapESPNToOffering(event, sportConfig.sport, sportConfig.league);
      if (offering) offerings.push(offering);
    }
    return offerings;
  } catch {
    return [];
  }
}

/**
 * Interleave question kinds so the slate does not open with eight consecutive
 * spreads. Grouping by kind made the list read as three separate lists.
 */
function interleaveByKind(all: Offering[]): Offering[] {
  const buckets = new Map<string, Offering[]>();
  for (const o of all) {
    const k = o.kind ?? 'spread';
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(o);
  }
  // Lead with the new kinds — they are the point of this change and burying
  // them under the spreads would hide them below the fold.
  const order = ['milestone', 'total', 'moneyline', 'spread'];
  const lists = order.map((k) => buckets.get(k) ?? []).filter((l) => l.length);
  const out: Offering[] = [];
  for (let i = 0; out.length < all.length; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
    if (i > 500) break; // belt and braces
  }
  return out;
}

export async function fetchAllOfferings(): Promise<Offering[]> {
  // Scoreboard spreads (existing) and core-API lines + props (new) run in
  // parallel and are merged. The core API is strictly additive: if it returns
  // nothing, the app behaves exactly as it did before.
  const [scoreboard, core] = await Promise.all([
    Promise.allSettled(SPORT_PATHS.map((config) => fetchSportOfferings(config))),
    fetchCoreOfferings().catch(() => [] as Offering[]),
  ]);

  const offerings: Offering[] = [];
  for (const result of scoreboard) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      offerings.push(...result.value);
    }
  }
  offerings.push(...core);

  // The scoreboard and the core API describe the same games, so a straight
  // merge can produce two cards with the same id.
  const deduped = [...new Map(offerings.map((o) => [o.id, o])).values()];

  return deduped.length === 0 ? staticOfferings : interleaveByKind(deduped);
}

let cachedOfferings: Offering[] | null = null;
let lastFetch = 0;

export async function getOfferings(forceRefresh = false): Promise<Offering[]> {
  const now = Date.now();
  if (!forceRefresh && cachedOfferings && now - lastFetch < REFRESH_INTERVAL_MS) {
    return cachedOfferings;
  }
  cachedOfferings = await fetchAllOfferings();
  lastFetch = now;
  return cachedOfferings;
}

export function getCachedOfferings(): Offering[] {
  return cachedOfferings ?? staticOfferings;
}

export { REFRESH_INTERVAL_MS };
