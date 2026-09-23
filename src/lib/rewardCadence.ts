import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { rewardTiers, winsRewardTiers, streakRewardTiers } from '../data/rewards';
import type { RewardTier } from '../types';

/**
 * Cadence simulator for the reward moment.
 *
 * The reward beat is meant to fire when a player crosses a threshold, which
 * in real play means winning three, five or seven picks. That is the correct
 * trigger and it is wired in `resolvePick` — but it makes the moment nearly
 * impossible to evaluate, because judging whether a celebration lands means
 * seeing it several times in a row and paying attention to the rhythm, not
 * grinding seven picks to see it once.
 *
 * So this replays it on demand, off the real game state.
 *
 * Opt-in via query string, never on by default:
 *
 *   ?buzz          every 8s, cycling every tier
 *   ?buzz=4        every 4s
 *   ?buzz=once     fire one immediately and stop
 *
 * Nothing here touches streak, wins or history — it only pushes a tier into
 * `pendingAward`. Simulating the *feeling* must not simulate the *record*, or
 * the numbers on screen stop matching the picks that produced them.
 */

const DEFAULT_INTERVAL_S = 8;

/** Smallest prize first, so repeated views show the escalation, not just the top tier. */
const CYCLE: RewardTier[] = [...winsRewardTiers, ...streakRewardTiers].sort(
  (a, b) => a.prizeValue - b.prizeValue || a.threshold - b.threshold
);

export function readBuzzParam(search = window.location.search): { on: boolean; once: boolean; intervalMs: number } {
  const params = new URLSearchParams(search);
  if (!params.has('buzz')) return { on: false, once: false, intervalMs: 0 };
  const raw = (params.get('buzz') ?? '').trim().toLowerCase();
  if (raw === 'once') return { on: true, once: true, intervalMs: 0 };
  const secs = Number(raw);
  const interval = Number.isFinite(secs) && secs > 0 ? secs : DEFAULT_INTERVAL_S;
  return { on: true, once: false, intervalMs: interval * 1000 };
}

export function useRewardCadence() {
  const award = useGameStore((s) => s.awardBonusBet);

  useEffect(() => {
    const { on, once, intervalMs } = readBuzzParam();
    if (!on) return;

    let i = 0;
    const fire = () => award(CYCLE[i++ % CYCLE.length]);

    // A short delay on the first one so it lands after the slate has painted.
    // Firing into an empty loading screen reads as a system message rather
    // than a reward for something.
    const lead = setTimeout(fire, 1200);
    if (once) return () => clearTimeout(lead);

    const timer = setInterval(fire, intervalMs);
    return () => {
      clearTimeout(lead);
      clearInterval(timer);
    };
  }, [award]);
}

/** Every tier, for the manual trigger on the Rewards page. */
export const ALL_TIERS = rewardTiers;
