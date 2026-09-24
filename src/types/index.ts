export type Sport = 'NFL' | 'NBA' | 'NHL' | 'MLB' | 'Soccer' | 'Golf' | 'WNBA' | 'WWE';

/**
 * What kind of question a card is asking.
 *
 * 'spread' is the original scoreboard-derived card, no longer generated
 * (see draftKingsApi.ts) but still handled defensively wherever grading
 * happens. 'moneyline' and 'total' come from the core API's priced odds
 * node, 'milestone' from its propBets collection. 'period' is a half or
 * quarter question on a manually-designated primetime game — there is no
 * priced line for it anywhere in the feed, so it carries no odds and grades
 * off the same scoreboard's real per-period linescores instead.
 */
export type OfferingKind = 'spread' | 'moneyline' | 'total' | 'milestone' | 'period';

export interface Offering {
  id: string;
  sport: Sport;
  league: string;
  question: string;
  optionA: string;
  optionB: string;
  shortA?: string;
  shortB?: string;
  abbrA?: string;
  abbrB?: string;
  imageA?: string;
  imageB?: string;
  colorA?: string;
  colorB?: string;
  watermarkA?: string;
  watermarkB?: string;
  oddsA?: string;
  oddsB?: string;
  pickPctA?: number;
  pickPctB?: number;
  startTime: string;
  startTimeISO?: string;
  confidence?: number;

  kind?: OfferingKind;

  /**
   * Probability that side A hits, 0..1.
   *
   * Needed because the propBets feed carries NO prices — 2,590 props sampled
   * across four NFL games returned zero odds fields. Without this, every
   * prop-derived question fell to `Math.random() < 0.5` in resolveOutcome,
   * so "6+ receiving yards" (near-certain) and "65+ receiving yards" (a real
   * question) resolved identically.
   *
   * For milestones it is the player's actual season hit rate against the
   * target. For priced questions it is left undefined and the odds are used.
   */
  winProbA?: number;

  /**
   * Pre-submit stat line shown on each side, e.g. "4 of 7 games".
   *
   * This is the honest replacement for a price. For a casual player "cleared
   * this in 4 of 7" states the reason the question is interesting, where
   * "-115" encodes it.
   */
  statA?: string;
  statB?: string;

  /** Milestone cards have no per-side artwork — both sides are the same player. */
  noSideArt?: boolean;

  /**
   * "Falcons @ Packers" — which real game a player prop belongs to.
   *
   * A moneyline or total card's question already names both teams, so this
   * is unused there. A milestone card's question is just the player and the
   * stat ("Jordan Love — 14+ completions?"), which says nothing about which
   * of the day's games it comes from.
   */
  gameLabel?: string;

  /**
   * Which option actually won, once the game has finished.
   *
   * Needed for the "you didn't pick this one" state: the board greys the
   * options out and marks the winner, which is impossible without knowing
   * the outcome. Distinct from the player's own result — this is what
   * happened, not how they did.
   *
   * Only present on finished games, and only where it is derivable.
   */
  correctSide?: PickSide;

  /**
   * Everything a server needs to grade this question after the fact.
   *
   * Without this the Cloud Function is impossible, not merely unwritten: a
   * pick document records offeringId, side and chosenOption, which is enough
   * to grade "who wins" by team name and nothing else. It cannot settle
   * "Over 6.5" — there is no line on it — and it cannot settle "Luis Garcia
   * 1+ hits" because it never knew which player or which stat.
   *
   * So the resolution inputs travel with the offering and get persisted
   * alongside the pick. The server then grades deterministically instead of
   * trying to reverse-engineer the question from its own answer text.
   */
  resolution?: {
    /** site.api path, e.g. 'baseball/mlb' */
    espnPath: string;
    eventId: string;
    competitionId: string;
    /** totals: the number the over/under is set at */
    line?: number;
    /** milestones */
    athleteId?: string;
    statKey?: string;
    target?: number;
    /**
     * periods: which ESPN linescore period indices (1-based) decide this
     * pick — [1,2] for 1st half, [3,4] for 2nd half, [3] for 3rd quarter
     * alone. Graded by summing each side's linescore entries for exactly
     * these periods, so it settles the moment they're all present in the
     * scoreboard rather than waiting for the whole game to finish.
     */
    periods?: number[];
  };

  /**
   * Single image for the whole card rather than one per side.
   *
   * A player prop is about one person, so a headshot belongs beside the
   * question, not duplicated onto both the Yes and the No button.
   */
  heroImage?: string;
}

export type PickSide = 'A' | 'B';
/**
 * 'void' covers a push — an over/under that lands exactly on the line.
 * Neither side won, so grading it either way would be wrong, and leaving it
 * 'pending' forever is the bug that shape of outcome usually causes.
 */
export type PickStatus = 'pending' | 'won' | 'lost' | 'void';

export interface ActivePick {
  offeringId: string;
  side: PickSide;
  chosenOption: string;
  startedAt: number;
  offering: Offering;
}

export interface PickRecord {
  id: string;
  offeringId: string;
  question: string;
  sport: Sport;
  league?: string;
  chosenOption: string;
  side: PickSide;
  status: PickStatus;
  timestamp: number;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  dailyWins: number;
  weeklyStreak: number;
  weeklyWins: number;
  allTimeWins: number;
  dailyPicks: number;
  weeklyPicks: number;
  allTimePicks: number;
  isCurrentUser?: boolean;
}

export interface RewardTier {
  id: string;
  type: 'streak' | 'wins';
  threshold: number;
  title: string;
  description: string;
  prize: string;
  prizeValue: number;
  icon: string;
}

export interface AchievementContext {
  consecutiveDaysWithWin: number;
  consecutiveWeeksWithWin: number;
  consecutiveWeeksStreakThreshold: number;
  consecutiveWeeksWinsThreshold: number;
  accountLinked: boolean;
  isWeeklyStreakLeader: boolean;
  isWeeklyWinsLeader: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeImage: string;
  earned: boolean;
  condition: (weeklyWins: number, weeklyStreak: number, allTimeWins: number, ctx?: AchievementContext) => boolean;
}
