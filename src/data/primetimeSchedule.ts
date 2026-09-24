/**
 * Which game gets the primetime period windows (1st half + 2nd half), by day.
 *
 * Hand-edited on purpose. There is no reliable signal in ESPN's public feed
 * for "this is the marquee game tonight" — broadcast network isn't exposed
 * on the scoreboard/odds endpoints this app already uses, and guessing from
 * kickoff time alone breaks on nights with two late games or no NFL at all.
 * An editor picking the game once a day is cheaper and more correct than
 * building a heuristic to approximate a human judgment call.
 *
 * Key is the ET calendar day (etDayKey format, 'YYYY-MM-DD'). A day with no
 * entry simply gets no primetime windows — the scheduler fills the rest of
 * its 4+ from the day's other real markets instead of guessing.
 */
export interface PrimetimeGame {
  /** LeagueRef.path from espnCoreOdds.ts, e.g. 'football/nfl' */
  espnPath: string;
  eventId: string;
}

export const primetimeSchedule: Record<string, PrimetimeGame> = {
  '2026-09-24': { espnPath: 'football/nfl', eventId: '401872948' }, // ATL @ GB
};
