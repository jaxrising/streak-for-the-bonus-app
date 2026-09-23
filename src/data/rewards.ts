import type { RewardTier, Achievement } from '../types';

export const winsRewardTiers: RewardTier[] = [
  {
    id: 'wins-1',
    type: 'wins',
    threshold: 3,
    title: 'Hot Picker',
    description: 'Win 3 picks in a week',
    prize: '$10 Bonus Bet',
    prizeValue: 10,
    icon: 'score',
  },
  {
    id: 'wins-2',
    type: 'wins',
    threshold: 5,
    title: 'On Fire',
    description: 'Win 5 picks in a week',
    prize: '$10 Bonus Bet',
    prizeValue: 10,
    icon: 'coin',
  },
  {
    id: 'wins-3',
    type: 'wins',
    threshold: 7,
    title: 'Untouchable',
    description: 'Win 7 picks in a week',
    prize: '$25 Bonus Bet',
    prizeValue: 25,
    icon: 'trophy',
  },
];

export const streakRewardTiers: RewardTier[] = [
  {
    id: 'streak-1',
    type: 'streak',
    threshold: 3,
    title: '3-Win Streak',
    description: 'Hit a 3-win streak',
    prize: '$10 Bonus Bet',
    prizeValue: 10,
    icon: 'fire-flame',
  },
  {
    id: 'streak-2',
    type: 'streak',
    threshold: 5,
    title: '5-Win Streak',
    description: 'Hit a 5-win streak',
    prize: '$10 Bonus Bet',
    prizeValue: 10,
    icon: 'bolt',
  },
  {
    id: 'streak-3',
    type: 'streak',
    threshold: 7,
    title: '7-Win Streak',
    description: 'Hit a 7-win streak',
    prize: '$25 Bonus Bet',
    prizeValue: 25,
    icon: 'diamond',
  },
];

export const rewardTiers: RewardTier[] = [...winsRewardTiers, ...streakRewardTiers];

export function getUnlockedRewards(weeklyWins: number, weeklyStreak: number) {
  const unlocked = rewardTiers.filter((t) =>
    t.type === 'streak' ? weeklyStreak >= t.threshold : weeklyWins >= t.threshold
  );
  const totalBonusBets = unlocked.reduce((sum, t) => sum + t.prizeValue, 0);
  return { unlocked, totalBonusBets };
}

export function getNextReward(weeklyWins: number, weeklyStreak: number, type: 'streak' | 'wins') {
  const tiers = type === 'streak' ? streakRewardTiers : winsRewardTiers;
  const current = type === 'streak' ? weeklyStreak : weeklyWins;
  const next = tiers.find((t) => current < t.threshold);
  if (!next) return null;
  const gap = next.threshold - current;
  const gapText = type === 'streak' ? `${gap} more in a row` : `${gap} more win${gap !== 1 ? 's' : ''}`;
  return { tier: next, gap, gapText };
}

export function getHighestUnlocked(weeklyWins: number, weeklyStreak: number, type: 'streak' | 'wins') {
  const tiers = type === 'streak' ? streakRewardTiers : winsRewardTiers;
  const current = type === 'streak' ? weeklyStreak : weeklyWins;
  const unlocked = tiers.filter((t) => current >= t.threshold);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

const BASE = import.meta.env.BASE_URL;

export const achievements: Achievement[] = [

  // ── Onboarding ──────────────────────────────────────────────────────────
  {
    id: 'tapped-in',
    title: 'Tapped In',
    description: 'Make your first pick',
    icon: 'score',
    badgeImage: `${BASE}badge-tapped-in.png`,
    earned: false,
    condition: (_w, _s, allTime) => allTime >= 1,
  },
  {
    id: 'first-win',
    title: 'Winner',
    description: 'Get your first win',
    icon: 'star',
    badgeImage: `${BASE}badge-first-win.png`,
    earned: false,
    condition: (_w, _s, allTime) => allTime >= 1,
  },
  {
    id: 'first-streak',
    title: 'On a Roll',
    description: 'Win 2 picks in a row',
    icon: 'fire-flame',
    badgeImage: `${BASE}badge-first-streak.png`,
    earned: false,
    condition: (_w, streak) => streak >= 2,
  },
  {
    id: 'link-up',
    title: 'Link Up',
    description: 'Connect your ESPN × DraftKings account',
    icon: 'bolt',
    badgeImage: `${BASE}badge-link-up.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => ctx?.accountLinked === true,
  },

  // ── Weekly thresholds (first time) ─────────────────────────────────────
  {
    id: 'first-wins-threshold',
    title: 'Cash Money',
    description: 'Hit the weekly wins threshold for the first time',
    icon: 'coin',
    badgeImage: `${BASE}badge-first-wins-threshold.png`,
    earned: false,
    condition: (weekly) => weekly >= 3,
  },
  {
    id: 'first-streak-threshold',
    title: 'Locked In',
    description: 'Hit the weekly streak threshold for the first time',
    icon: 'diamond',
    badgeImage: `${BASE}badge-first-streak-threshold.png`,
    earned: false,
    condition: (_w, streak) => streak >= 3,
  },

  // ── Weekly leaderboard ──────────────────────────────────────────────────
  {
    id: 'weekly-streak-leader',
    title: 'Top Dog',
    description: 'Finish with the longest streak in a week',
    icon: 'trophy',
    badgeImage: `${BASE}badge-top-dog.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => ctx?.isWeeklyStreakLeader === true,
  },
  {
    id: 'weekly-wins-leader',
    title: 'Volume King',
    description: 'Finish with the most wins in a week',
    icon: 'trophy',
    badgeImage: `${BASE}badge-volume-king.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => ctx?.isWeeklyWinsLeader === true,
  },

  // ── Consecutive days with 1+ wins ───────────────────────────────────────
  {
    id: 'days-3',
    title: 'Hat Trick',
    description: '3 days in a row with at least 1 win',
    icon: 'fire-flame',
    badgeImage: `${BASE}badge-days-3.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveDaysWithWin ?? 0) >= 3,
  },
  {
    id: 'days-7',
    title: 'Week Warrior',
    description: '7 days in a row with at least 1 win',
    icon: 'fire-flame',
    badgeImage: `${BASE}badge-days-7.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveDaysWithWin ?? 0) >= 7,
  },
  {
    id: 'days-30',
    title: 'Monthly Regular',
    description: '30 days in a row with at least 1 win',
    icon: 'bolt',
    badgeImage: `${BASE}badge-days-30.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveDaysWithWin ?? 0) >= 30,
  },
  {
    id: 'days-100',
    title: 'Century Club',
    description: '100 days in a row with at least 1 win',
    icon: 'diamond',
    badgeImage: `${BASE}badge-days-100.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveDaysWithWin ?? 0) >= 100,
  },
  {
    id: 'days-365',
    title: 'Full Season',
    description: '365 days in a row with at least 1 win',
    icon: 'trophy',
    badgeImage: `${BASE}badge-days-365.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveDaysWithWin ?? 0) >= 365,
  },

  // ── Consecutive weeks with 1+ wins ──────────────────────────────────────
  {
    id: 'weeks-wins-2',
    title: 'Back to Back',
    description: '2 weeks in a row with at least 1 win',
    icon: 'score',
    badgeImage: `${BASE}badge-weeks-wins-2.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWithWin ?? 0) >= 2,
  },
  {
    id: 'weeks-wins-4',
    title: 'Monthly',
    description: '4 weeks in a row with at least 1 win',
    icon: 'score',
    badgeImage: `${BASE}badge-weeks-wins-4.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWithWin ?? 0) >= 4,
  },
  {
    id: 'weeks-wins-10',
    title: 'Ten-acity',
    description: '10 weeks in a row with at least 1 win',
    icon: 'bolt',
    badgeImage: `${BASE}badge-weeks-wins-10.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWithWin ?? 0) >= 10,
  },
  {
    id: 'weeks-wins-20',
    title: 'Half a Year',
    description: '20 weeks in a row with at least 1 win',
    icon: 'diamond',
    badgeImage: `${BASE}badge-weeks-wins-20.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWithWin ?? 0) >= 20,
  },
  {
    id: 'weeks-wins-50',
    title: 'Perennial',
    description: '50 weeks in a row with at least 1 win',
    icon: 'trophy',
    badgeImage: `${BASE}badge-weeks-wins-50.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWithWin ?? 0) >= 50,
  },

  // ── Consecutive weeks hitting streak threshold ───────────────────────────
  {
    id: 'weeks-streak-2',
    title: 'Streak Habit',
    description: '2 weeks in a row hitting the streak threshold',
    icon: 'fire-flame',
    badgeImage: `${BASE}badge-weeks-streak-2.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksStreakThreshold ?? 0) >= 2,
  },
  {
    id: 'weeks-streak-4',
    title: 'Streak Routine',
    description: '4 weeks in a row hitting the streak threshold',
    icon: 'fire-flame',
    badgeImage: `${BASE}badge-weeks-streak-4.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksStreakThreshold ?? 0) >= 4,
  },
  {
    id: 'weeks-streak-10',
    title: 'Streak Machine',
    description: '10 weeks in a row hitting the streak threshold',
    icon: 'bolt',
    badgeImage: `${BASE}badge-weeks-streak-10.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksStreakThreshold ?? 0) >= 10,
  },
  {
    id: 'weeks-streak-20',
    title: 'Streak Sensation',
    description: '20 weeks in a row hitting the streak threshold',
    icon: 'diamond',
    badgeImage: `${BASE}badge-weeks-streak-20.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksStreakThreshold ?? 0) >= 20,
  },
  {
    id: 'weeks-streak-50',
    title: 'Streak Legend',
    description: '50 weeks in a row hitting the streak threshold',
    icon: 'trophy',
    badgeImage: `${BASE}badge-weeks-streak-50.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksStreakThreshold ?? 0) >= 50,
  },

  // ── Consecutive weeks hitting wins threshold ─────────────────────────────
  {
    id: 'weeks-winsthreshold-2',
    title: 'Double Down',
    description: '2 weeks in a row hitting the wins threshold',
    icon: 'score',
    badgeImage: `${BASE}badge-weeks-winsthreshold-2.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWinsThreshold ?? 0) >= 2,
  },
  {
    id: 'weeks-winsthreshold-4',
    title: 'Four-Peat',
    description: '4 weeks in a row hitting the wins threshold',
    icon: 'score',
    badgeImage: `${BASE}badge-weeks-winsthreshold-4.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWinsThreshold ?? 0) >= 4,
  },
  {
    id: 'weeks-winsthreshold-10',
    title: 'Certified Grinder',
    description: '10 weeks in a row hitting the wins threshold',
    icon: 'bolt',
    badgeImage: `${BASE}badge-weeks-winsthreshold-10.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWinsThreshold ?? 0) >= 10,
  },
  {
    id: 'weeks-winsthreshold-20',
    title: 'Iron Picker',
    description: '20 weeks in a row hitting the wins threshold',
    icon: 'diamond',
    badgeImage: `${BASE}badge-weeks-winsthreshold-20.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWinsThreshold ?? 0) >= 20,
  },
  {
    id: 'weeks-winsthreshold-50',
    title: 'Untouchable',
    description: '50 weeks in a row hitting the wins threshold',
    icon: 'trophy',
    badgeImage: `${BASE}badge-weeks-winsthreshold-50.png`,
    earned: false,
    condition: (_w, _s, _a, ctx) => (ctx?.consecutiveWeeksWinsThreshold ?? 0) >= 50,
  },
];
