import type { Offering } from '../types';
import { offlineOfferings } from '../data/offlineSnapshot';
import { fetchCoreOfferings } from './espnCoreOdds';

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

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Interleave question kinds so the slate does not open with eight consecutive
 * totals. Grouping by kind made the list read as separate lists.
 */
function interleaveByKind(all: Offering[]): Offering[] {
  const buckets = new Map<string, Offering[]>();
  for (const o of all) {
    const k = o.kind ?? 'moneyline';
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(o);
  }
  // Lead with the new kinds — they are the point of this change and burying
  // them under the moneylines would hide them below the fold.
  const order = ['milestone', 'total', 'moneyline'];
  const lists = order.map((k) => buckets.get(k) ?? []).filter((l) => l.length);
  const out: Offering[] = [];
  for (let i = 0; out.length < all.length; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i]);
    if (i > 500) break; // belt and braces
  }
  return out;
}

export async function fetchAllOfferings(): Promise<Offering[]> {
  /*
   * Straight-up winner, priced total, and milestone props — all from the
   * core API. A separate scoreboard-derived "spread" kind used to run
   * alongside this and get merged in, but it graded identically to
   * moneyline (both settle on the literal game winner, never the spread
   * line) while showing spread-flavored odds nobody could act on. On any
   * game with both markets priced, that produced two cards with the same
   * teams and no way to tell them apart. Moneyline is the one whose label
   * matches how it's actually graded, so it's the one that stayed.
   */
  const core = await fetchCoreOfferings().catch(() => [] as Offering[]);

  const deduped = [...new Map(core.map((o) => [o.id, o])).values()];

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
