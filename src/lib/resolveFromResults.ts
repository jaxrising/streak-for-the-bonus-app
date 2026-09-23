/**
 * Real outcome resolution — checks game results and resolves picks.
 *
 * In production, this runs as a Firebase Cloud Function on a schedule.
 * This client-side module provides the logic for:
 * 1. Checking if a game has completed (via ESPN or DraftKings results)
 * 2. Determining the winner
 * 3. Batch-resolving all picks for that game
 *
 * For the prototype, resolution still happens client-side with simulated odds.
 * When Firebase is connected, this module triggers server-side resolution.
 */

import type { Offering } from '../types';

const ESPN_SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

interface ESPNCompetitor {
  team: { abbreviation: string; displayName: string };
  winner?: boolean;
  score: string;
}

interface ESPNCompetition {
  id: string;
  status: { type: { completed: boolean; description: string } };
  competitors: ESPNCompetitor[];
}

interface ESPNEvent {
  id: string;
  competitions: ESPNCompetition[];
}

interface ESPNScoreboard {
  events: ESPNEvent[];
}

const SPORT_ESPN_PATHS: Record<string, string> = {
  NFL: 'football/nfl',
  NBA: 'basketball/nba',
  MLB: 'baseball/mlb',
  NHL: 'hockey/nhl',
  WNBA: 'basketball/wnba',
  Soccer: 'soccer/eng.1',
};

export interface GameResult {
  eventId: string;
  completed: boolean;
  winner: string | null;
  scoreA: string;
  scoreB: string;
  teamA: string;
  teamB: string;
}

export async function checkGameResults(sport: string): Promise<GameResult[]> {
  const path = SPORT_ESPN_PATHS[sport];
  if (!path) return [];

  try {
    const url = `${ESPN_SCOREBOARD_BASE}/${path}/scoreboard`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data: ESPNScoreboard = await res.json();
    const results: GameResult[] = [];

    for (const event of data.events) {
      const comp = event.competitions[0];
      if (!comp) continue;

      const teamA = comp.competitors[0]?.team.displayName ?? '';
      const teamB = comp.competitors[1]?.team.displayName ?? '';
      const winner = comp.competitors.find((c) => c.winner)?.team.displayName ?? null;

      results.push({
        eventId: event.id,
        completed: comp.status.type.completed,
        winner,
        scoreA: comp.competitors[0]?.score ?? '0',
        scoreB: comp.competitors[1]?.score ?? '0',
        teamA,
        teamB,
      });
    }

    return results;
  } catch {
    return [];
  }
}

export function determinePickOutcome(
  offering: Offering,
  pickedSide: 'A' | 'B',
  results: GameResult[],
): 'won' | 'lost' | 'pending' {
  const matchingResult = results.find((r) => {
    const rTeams = [r.teamA.toLowerCase(), r.teamB.toLowerCase()];
    const oTeams = [offering.optionA.toLowerCase(), offering.optionB.toLowerCase()];
    return rTeams.some((t) => oTeams.includes(t)) || oTeams.some((t) => rTeams.includes(t));
  });

  if (!matchingResult || !matchingResult.completed || !matchingResult.winner) {
    return 'pending';
  }

  const pickedOption = pickedSide === 'A' ? offering.optionA : offering.optionB;
  return matchingResult.winner.toLowerCase() === pickedOption.toLowerCase() ? 'won' : 'lost';
}

/**
 * Cloud Function entry point (pseudo-code for Firebase deployment).
 *
 * In production, deploy this as:
 *   exports.resolveGames = functions.pubsub.schedule('every 5 minutes').onRun(...)
 *
 * It would:
 * 1. Query Firestore for all pending picks
 * 2. Group by sport, fetch results for each
 * 3. For each completed game, batch-update picks to won/lost
 * 4. Update user stats (streak, wins) atomically
 * 5. Trigger push notifications for resolved picks
 */
export async function resolveCompletedGames(
  pendingPicks: { uid: string; offeringId: string; side: 'A' | 'B'; offering: Offering }[],
): Promise<{ uid: string; offeringId: string; won: boolean }[]> {
  const sportSet = new Set(pendingPicks.map((p) => p.offering.sport));
  const allResults: GameResult[] = [];

  for (const sport of sportSet) {
    const results = await checkGameResults(sport);
    allResults.push(...results);
  }

  const resolved: { uid: string; offeringId: string; won: boolean }[] = [];

  for (const pick of pendingPicks) {
    const outcome = determinePickOutcome(pick.offering, pick.side, allResults);
    if (outcome !== 'pending') {
      resolved.push({ uid: pick.uid, offeringId: pick.offeringId, won: outcome === 'won' });
    }
  }

  return resolved;
}
