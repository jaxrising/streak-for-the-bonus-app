import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { signOut } from '../firebase/auth';
import { achievements } from '../data/rewards';
import { AchievementCardLarge, AchievementGridItem } from '../components/AchievementBadge';
import PickHistoryList from '../components/PickHistoryList';

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

export default function ProfilePage() {
  const { weeklyStreak, weeklyWins, allTimeWins, pickHistory } = useGameStore();
  const profile = useAuthStore((s) => s.profile);

  const computedAchievements = useMemo(
    () =>
      achievements.map((a) => ({
        ...a,
        earned: a.condition(weeklyWins, weeklyStreak, allTimeWins),
      })),
    [weeklyWins, weeklyStreak, allTimeWins]
  );

  const earnedAchievements = computedAchievements.filter((a) => a.earned);
  const totalPicks = pickHistory.length;
  const wins = pickHistory.filter((p) => p.status === 'won').length;
  const winRate = totalPicks > 0 ? Math.round((wins / totalPicks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="text-center">
        <h2 className="text-[20px] leading-[26px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>
          {USE_FIREBASE && profile ? profile.displayName : 'You'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-theme-text-tertiary)' }}>
          {USE_FIREBASE && profile ? profile.email : 'Streak Player'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Streak', value: weeklyStreak, color: 'var(--color-streak)' },
          { label: 'Weekly W', value: weeklyWins, color: 'var(--color-wins)' },
          { label: 'All-Time', value: allTimeWins, color: 'var(--color-theme-text)' },
          { label: 'Win %', value: `${winRate}%`, color: '#ffc432' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border rounded-xl p-3 text-center"
            style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
          >
            <div className="text-lg font-bold font-display tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recently Earned carousel */}
      {earnedAchievements.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-3">
            <h3 className="text-[14px] leading-[18px] font-medium font-body" style={{ color: 'var(--color-theme-text)' }}>
              Recently Earned
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {earnedAchievements.map((a) => (
              <AchievementCardLarge key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}

      {/* All Achievements grid */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h3 className="text-[14px] leading-[18px] font-medium font-body" style={{ color: 'var(--color-theme-text)' }}>
            All Achievements
          </h3>
          <span className="text-[12px] leading-[16px] font-body" style={{ color: 'var(--color-theme-text-muted)' }}>
            {earnedAchievements.length} / {computedAchievements.length} Earned
          </span>
        </div>
        <div
          className="border rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
        >
          <div className="grid grid-cols-3 gap-4">
            {computedAchievements.map((a) => (
              <AchievementGridItem key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      </div>

      {/* Pick History */}
      <div>
        <h3 className="text-[16px] leading-[24px] font-bold uppercase font-title mb-3" style={{ color: 'var(--color-theme-text-secondary)' }}>
          Pick History
        </h3>
        <PickHistoryList />
      </div>

      {/* Sign out */}
      {USE_FIREBASE && (
        <div className="pt-4 text-center">
          <button
            onClick={() => signOut()}
            className="text-xs underline transition-colors"
            style={{ color: 'var(--color-theme-text-muted)' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
