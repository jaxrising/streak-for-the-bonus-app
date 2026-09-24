import type { Offering } from '../types';
import { etDateAt } from './timeFormat';
import { primetimeSchedule } from '../data/primetimeSchedule';

/**
 * Curated pick windows, not a browsable board.
 *
 * Streak's strategy comes from a small, deliberate slate of picking
 * opportunities across the day, not from a menu of every market on every
 * game. This is the scheduler that turns one day's real offerings into that
 * slate.
 */
export const MIN_WINDOWS_PER_DAY = 4;

function lockTime(o: Offering): number {
  return o.startTimeISO ? new Date(o.startTimeISO).getTime() : Infinity;
}

/**
 * Curates one ET day's pick windows.
 *
 * Hard constraints:
 *  - 1-2 windows lock before noon ET. If 2, the second locks at or after
 *    11am ET, so a west-coast player isn't forced awake for a 2nd early
 *    pick right behind the first.
 *  - Both primetime period windows (see espnCoreOdds.fetchPrimetimeOfferings)
 *    count toward the day's total when primetimeSchedule has an entry for it.
 *  - At least MIN_WINDOWS_PER_DAY total, filled from the day's other real
 *    markets once the above are placed.
 *
 * A day that doesn't actually have MIN_WINDOWS_PER_DAY worth of real markets
 * (a slow Tuesday, or no primetime entry) returns fewer rather than
 * inventing content to hit the number — this curates what's real, it
 * doesn't guarantee a count no matter what the slate looks like.
 */
export function buildDailyWindows(
  dayKey: string,
  dayOfferings: Offering[],
  primetimeOfferings: Offering[]
): Offering[] {
  const windows: Offering[] = [];
  const usedIds = new Set<string>();
  const add = (o: Offering) => {
    if (usedIds.has(o.id)) return;
    usedIds.add(o.id);
    windows.push(o);
  };

  const candidates = dayOfferings.filter((o) => o.startTimeISO).sort((a, b) => lockTime(a) - lockTime(b));

  const noon = etDateAt(dayKey, 12).getTime();
  const elevenAm = etDateAt(dayKey, 11).getTime();

  const preNoon = candidates.filter((o) => lockTime(o) < noon);
  if (preNoon.length > 0) {
    add(preNoon[0]);
    const second = preNoon.find((o) => o.id !== preNoon[0].id && lockTime(o) >= elevenAm);
    if (second) add(second);
  }

  for (const p of primetimeOfferings) add(p);

  const primetimeEventId = primetimeSchedule[dayKey]?.eventId;

  for (const o of candidates) {
    if (windows.length >= MIN_WINDOWS_PER_DAY) break;
    if (usedIds.has(o.id)) continue;
    // The primetime game's own full-game markets are left out once its two
    // period windows are in — a window is meant to add variety, not stack
    // three picks onto the one game that already has two.
    if (primetimeEventId && o.resolution?.eventId === primetimeEventId) continue;
    add(o);
  }

  return windows.sort((a, b) => lockTime(a) - lockTime(b));
}
