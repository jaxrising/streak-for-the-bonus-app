import { create } from 'zustand';
import type { Achievement, AchievementContext, ActivePick, PickRecord, PickSide, Offering, RewardTier } from '../types';
import { achievements, rewardTiers } from '../data/rewards';
import { offlineDemoHistory, offlineDemoStats } from '../data/offlineSnapshot';
import { etDayKey } from '../lib/timeFormat';

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

/*
 * Demo seed — prior-day results so the board has something to show when you
 * tap back to a day already played.
 *
 * OFF whenever Firebase is on. With a real backend every player has a real
 * record, and seeding five fabricated results into it would put invented
 * wins in a stranger's history on first load. Worse, `syncFromFirebase`
 * overwrites the stats but not `pickHistory`, so the counters would correct
 * themselves to zero while five phantom picks stayed on the board — a
 * disagreement that looks like data loss rather than a seed.
 */
const SEED_HISTORY = USE_FIREBASE ? [] : offlineDemoHistory;
const SEED_STATS = USE_FIREBASE
  ? { weeklyWins: 0, allTimeWins: 0, weeklyStreak: 0 }
  : offlineDemoStats;

interface PendingSelection {
  offeringId: string;
  side: PickSide;
  chosenOption: string;
  offering: Offering;
}

interface GameState {
  activePick: ActivePick | null;
  pendingSelection: PendingSelection | null;
  /**
   * Most recent submission, for SubmitPickBar's post-submit confirmation.
   * Display-only — NOT the gate. See submittedPicks for that.
   */
  submittedPick: { offeringId: string; side: PickSide; chosenOption: string } | null;
  /**
   * Every offering submitted today, keyed by offeringId.
   *
   * Streak runs on multiple pick windows a day, not one — a single global
   * "submitted" flag (the previous shape here) meant finishing window 1
   * locked the player out of window 2 until a page reload, since nothing
   * ever reset it. Gating is per-offering instead: submitting one window
   * does not block any other.
   */
  submittedPicks: Record<string, { side: PickSide; chosenOption: string }>;
  weeklyStreak: number;
  longestWeeklyStreak: number;
  weeklyWins: number;
  allTimeWins: number;
  pickHistory: PickRecord[];
  espnLinked: boolean;
  dkLinked: boolean;
  uid: string | null;
  newlyEarnedAchievement: Achievement | null;
  /** A plain-text toast, e.g. "Come back Thu, Sep 25 to make this pick." */
  futureDayNotice: string | null;
  /**
   * The reward moment, queued for BonusBetAward to present.
   *
   * Separate from newlyEarnedAchievement on purpose. An achievement is a
   * badge and gets a 4s toast; a bonus bet is the payoff the whole loop
   * builds to and gets a blocking, tap-to-dismiss celebration. Sharing one
   * channel would have forced them to share a presentation too.
   */
  pendingAward: RewardTier | null;
  // Consecutive tracking
  lastWinDate: string | null;
  consecutiveDaysWithWin: number;
  consecutiveWeeksWithWin: number;
  consecutiveWeeksStreakThreshold: number;
  consecutiveWeeksWinsThreshold: number;
  // Weekly leaderboard flags (set server-side)
  isWeeklyStreakLeader: boolean;
  isWeeklyWinsLeader: boolean;

  selectPick: (offering: Offering, side: PickSide) => void;
  submitPick: () => void;
  makePick: (offering: Offering, side: PickSide) => void;
  resolvePick: (won: boolean) => void;
  resetWeek: () => void;
  resetDemo: () => void;
  linkESPN: () => void;
  linkDK: () => void;
  setUser: (uid: string | null) => void;
  syncFromFirebase: (data: { weeklyStreak: number; weeklyWins: number; allTimeWins: number }) => void;
  clearAchievementToast: () => void;
  showFutureDayNotice: (message: string) => void;
  clearFutureDayNotice: () => void;
  awardBonusBet: (tier: RewardTier) => void;
  clearAward: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  activePick: null,
  pendingSelection: null,
  submittedPick: null,
  submittedPicks: {},
  weeklyStreak: SEED_STATS.weeklyStreak,
  longestWeeklyStreak: SEED_STATS.weeklyStreak,
  weeklyWins: SEED_STATS.weeklyWins,
  allTimeWins: SEED_STATS.allTimeWins,
  uid: null,
  pickHistory: SEED_HISTORY,
  espnLinked: false,
  dkLinked: false,
  newlyEarnedAchievement: null,
  futureDayNotice: null,
  pendingAward: null,
  lastWinDate: null,
  consecutiveDaysWithWin: 0,
  consecutiveWeeksWithWin: 0,
  consecutiveWeeksStreakThreshold: 0,
  consecutiveWeeksWinsThreshold: 0,
  isWeeklyStreakLeader: false,
  isWeeklyWinsLeader: false,

  selectPick: (offering, side) => {
    const state = get();
    if (state.submittedPicks[offering.id]) return;

    if (
      state.pendingSelection?.offeringId === offering.id &&
      state.pendingSelection?.side === side
    ) {
      set({ pendingSelection: null });
      return;
    }

    const chosenOption = side === 'A' ? offering.optionA : offering.optionB;
    set({
      pendingSelection: { offeringId: offering.id, side, chosenOption, offering },
    });
  },

  submitPick: () => {
    const state = get();
    if (!state.pendingSelection || state.submittedPicks[state.pendingSelection.offeringId]) return;

    const { offeringId, side, chosenOption, offering } = state.pendingSelection;
    const pendingRecord: PickRecord = {
      id: `pick-${Date.now()}`,
      offeringId,
      question: offering.question,
      sport: offering.sport,
      chosenOption,
      side,
      status: 'pending',
      timestamp: Date.now(),
    };

    set({
      activePick: {
        offeringId,
        side,
        chosenOption,
        startedAt: Date.now(),
        offering,
      },
      submittedPick: { offeringId, side, chosenOption },
      submittedPicks: { ...state.submittedPicks, [offeringId]: { side, chosenOption } },
      pendingSelection: null,
      pickHistory: [pendingRecord, ...state.pickHistory],
    });

    if (USE_FIREBASE && state.uid) {
      const odds = side === 'A' ? (offering.oddsA ?? '') : (offering.oddsB ?? '');
      import('../firebase/collections').then(({ recordPick }) => {
        recordPick(state.uid!, offeringId, side, chosenOption, odds, offering);
      });
      // Keyed by offeringId, not a fixed 'current' doc — multiple windows
      // can be active the same day, and each needs its own row to survive
      // a reload (see authStore's restore, which reads this whole subcollection).
      const dayKey = etDayKey(new Date());
      import('firebase/firestore').then(({ doc, setDoc }) => {
        import('../firebase/config').then(({ db }) => {
          setDoc(doc(db, 'users', state.uid!, 'activePick', offeringId), {
            offeringId,
            side,
            chosenOption,
            startedAt: Date.now(),
            date: dayKey,
          });
        });
      });
    }
  },

  makePick: (offering, side) => {
    const state = get();
    if (state.activePick) return;

    const chosenOption = side === 'A' ? offering.optionA : offering.optionB;
    const pendingRecord: PickRecord = {
      id: `pick-${Date.now()}`,
      offeringId: offering.id,
      question: offering.question,
      sport: offering.sport,
      chosenOption,
      side,
      status: 'pending',
      timestamp: Date.now(),
    };

    set({
      activePick: {
        offeringId: offering.id,
        side,
        chosenOption,
        startedAt: Date.now(),
        offering,
      },
      pickHistory: [pendingRecord, ...state.pickHistory],
    });

    if (USE_FIREBASE && state.uid) {
      const odds = side === 'A' ? (offering.oddsA ?? '') : (offering.oddsB ?? '');
      import('../firebase/collections').then(({ recordPick }) => {
        recordPick(state.uid!, offering.id, side, chosenOption, odds, offering);
      });
    }
  },

  resolvePick: (won) => {
    const state = get();
    if (!state.activePick) return;

    /*
     * With Firebase on, the server owns resolution.
     *
     * The Cloud Function grades pending picks and increments weeklyWins,
     * allTimeWins and weeklyStreak in Firestore. This function does the same
     * thing locally AND calls resolvePickFB, which increments them a second
     * time — so every win counted twice and every streak ran at double
     * speed. Silent, and only visible once two people compare leaderboards.
     *
     * Client-side resolution stays for the local prototype, where there is
     * no server to do it.
     */
    if (USE_FIREBASE) return;

    const offeringId = state.activePick.offeringId;

    const updatedHistory = state.pickHistory.map((r) =>
      r.offeringId === offeringId && r.status === 'pending'
        ? { ...r, status: (won ? 'won' : 'lost') as PickRecord['status'] }
        : r
    );

    const newStreak = won ? state.weeklyStreak + 1 : 0;
    const newWeeklyWins = won ? state.weeklyWins + 1 : state.weeklyWins;
    const newAllTimeWins = won ? state.allTimeWins + 1 : state.allTimeWins;
    const newLongest = Math.max(state.longestWeeklyStreak, newStreak);

    // Consecutive days tracking
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newConsecutiveDays = state.consecutiveDaysWithWin;
    let newLastWinDate = state.lastWinDate;
    if (won && state.lastWinDate !== today) {
      newConsecutiveDays = state.lastWinDate === yesterday ? state.consecutiveDaysWithWin + 1 : 1;
      newLastWinDate = today;
    }

    const ctx: AchievementContext = {
      consecutiveDaysWithWin: newConsecutiveDays,
      consecutiveWeeksWithWin: state.consecutiveWeeksWithWin,
      consecutiveWeeksStreakThreshold: state.consecutiveWeeksStreakThreshold,
      consecutiveWeeksWinsThreshold: state.consecutiveWeeksWinsThreshold,
      accountLinked: state.espnLinked && state.dkLinked,
      isWeeklyStreakLeader: state.isWeeklyStreakLeader,
      isWeeklyWinsLeader: state.isWeeklyWinsLeader,
    };

    set({
      activePick: null,
      weeklyStreak: newStreak,
      longestWeeklyStreak: newLongest,
      weeklyWins: newWeeklyWins,
      allTimeWins: newAllTimeWins,
      pickHistory: updatedHistory,
      lastWinDate: newLastWinDate,
      consecutiveDaysWithWin: newConsecutiveDays,
    });

    /*
     * Reward thresholds crossed by THIS pick.
     *
     * Compared before/after rather than tested against the new totals alone,
     * so the celebration fires once on the pick that crosses the line instead
     * of on every subsequent win while still above it.
     *
     * Only one is presented even if a pick crosses two at once (a 3-win
     * streak that is also the 3rd weekly win). Two celebrations stacked on
     * one tap reads as a bug, and the larger prize is the one worth showing.
     */
    if (won) {
      const before = new Set(
        rewardTiers
          .filter((t) => (t.type === 'streak' ? state.weeklyStreak : state.weeklyWins) >= t.threshold)
          .map((t) => t.id)
      );
      const crossed = rewardTiers
        .filter((t) => !before.has(t.id) && (t.type === 'streak' ? newStreak : newWeeklyWins) >= t.threshold)
        .sort((a, b) => b.prizeValue - a.prizeValue);
      if (crossed.length) set({ pendingAward: crossed[0] });
    }

    if (won) {
      const previouslyEarned = new Set(
        achievements
          .filter((a) => a.condition(state.weeklyWins, state.weeklyStreak, state.allTimeWins, ctx))
          .map((a) => a.id)
      );
      const newlyEarned = achievements.find(
        (a) => !previouslyEarned.has(a.id) && a.condition(newWeeklyWins, newStreak, newAllTimeWins, ctx)
      );
      if (newlyEarned) {
        set({ newlyEarnedAchievement: newlyEarned });
      }
    }

  },

  resetWeek: () => {
    const state = get();
    const WINS_THRESHOLD = 3;
    const STREAK_THRESHOLD = 3;
    set({
      weeklyStreak: 0,
      longestWeeklyStreak: 0,
      weeklyWins: 0,
      consecutiveWeeksWithWin: state.weeklyWins > 0 ? state.consecutiveWeeksWithWin + 1 : 0,
      consecutiveWeeksStreakThreshold: state.longestWeeklyStreak >= STREAK_THRESHOLD ? state.consecutiveWeeksStreakThreshold + 1 : 0,
      consecutiveWeeksWinsThreshold: state.weeklyWins >= WINS_THRESHOLD ? state.consecutiveWeeksWinsThreshold + 1 : 0,
    });
  },

  resetDemo: () => {
    set({
      activePick: null,
      pendingSelection: null,
      submittedPick: null,
      submittedPicks: {},
      weeklyStreak: SEED_STATS.weeklyStreak,
      longestWeeklyStreak: SEED_STATS.weeklyStreak,
      weeklyWins: SEED_STATS.weeklyWins,
      allTimeWins: SEED_STATS.allTimeWins,
      pickHistory: SEED_HISTORY,
      espnLinked: false,
      dkLinked: false,
      pendingAward: null,
      lastWinDate: null,
      consecutiveDaysWithWin: 0,
      consecutiveWeeksWithWin: 0,
      consecutiveWeeksStreakThreshold: 0,
      consecutiveWeeksWinsThreshold: 0,
    });
  },

  linkESPN: () => set({ espnLinked: true }),
  linkDK: () => {
    set({ dkLinked: true });
    // Check for Link Up achievement
    const state = get();
    const ctx: AchievementContext = {
      consecutiveDaysWithWin: state.consecutiveDaysWithWin,
      consecutiveWeeksWithWin: state.consecutiveWeeksWithWin,
      consecutiveWeeksStreakThreshold: state.consecutiveWeeksStreakThreshold,
      consecutiveWeeksWinsThreshold: state.consecutiveWeeksWinsThreshold,
      accountLinked: true,
      isWeeklyStreakLeader: state.isWeeklyStreakLeader,
      isWeeklyWinsLeader: state.isWeeklyWinsLeader,
    };
    const linkAchievement = achievements.find(
      (a) => a.id === 'link-up' && !a.condition(state.weeklyWins, state.weeklyStreak, state.allTimeWins, { ...ctx, accountLinked: false })
        && a.condition(state.weeklyWins, state.weeklyStreak, state.allTimeWins, ctx)
    );
    if (linkAchievement) set({ newlyEarnedAchievement: linkAchievement });
  },
  clearAchievementToast: () => set({ newlyEarnedAchievement: null }),
  showFutureDayNotice: (message) => set({ futureDayNotice: message }),
  clearFutureDayNotice: () => set({ futureDayNotice: null }),

  /** Present a reward moment directly. Used by the cadence simulator. */
  awardBonusBet: (tier) => set({ pendingAward: tier }),
  clearAward: () => set({ pendingAward: null }),

  setUser: (uid) => set({ uid }),

  syncFromFirebase: (data) => set({
    weeklyStreak: data.weeklyStreak,
    weeklyWins: data.weeklyWins,
    allTimeWins: data.allTimeWins,
  }),
}));
