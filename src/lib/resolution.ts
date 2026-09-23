import type { Offering, PickSide } from '../types';

const UPSET_BOOST = 0.05;

export function parseAmericanOdds(odds: string): number {
  const num = parseInt(odds, 10);
  if (num > 0) {
    return 100 / (num + 100);
  }
  return Math.abs(num) / (Math.abs(num) + 100);
}

/**
 * Simulated resolution.
 *
 * This is not grading — no box score is read. The prototype rolls dice; the
 * job here is to roll *well-weighted* dice, because a slate where every
 * question is secretly 50/50 feels arbitrary in a way that is hard to
 * diagnose later.
 *
 * Probability comes from, in order:
 *
 *  1. American odds, where the feed has a price (spread, moneyline, total).
 *  2. `winProbA`, the measured hit rate, for milestone props. The propBets
 *     feed carries no prices at all, so without this every prop fell to the
 *     coin flip below and "6+ receiving yards" resolved the same as "65+".
 *  3. A coin flip, only when neither exists.
 */
export function resolveOutcome(offering: Offering, side: PickSide): boolean {
  const odds = side === 'A' ? offering.oddsA : offering.oddsB;

  let winProb: number;
  if (odds) {
    winProb = parseAmericanOdds(odds);
  } else if (offering.winProbA != null) {
    winProb = side === 'A' ? offering.winProbA : 1 - offering.winProbA;
  } else {
    return Math.random() < 0.5;
  }

  // Nudge the underdog. Keeps a long-odds pick from feeling pointless, and
  // is why the streak mechanic stays tense rather than purely arithmetic.
  if (winProb < 0.5) {
    winProb += UPSET_BOOST;
  }

  return Math.random() < winProb;
}

export function getResolveDelay(offering: Offering): number {
  const match = offering.startTime.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 5000;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const gameMinutes = hours * 60 + minutes;
  const seed = (gameMinutes * 7 + 13) % 100;
  const delay = 4000 + seed * 40;

  return delay;
}

export const RESOLVE_DELAY_MS = 5000;
export const RESULT_DISPLAY_MS = 2500;
