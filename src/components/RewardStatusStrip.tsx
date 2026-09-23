import { useGameStore } from '../store/gameStore';
import { getHighestUnlocked, getNextReward } from '../data/rewards';
import { Icon } from './icons';

export default function RewardStatusStrip() {
  const weeklyWins = useGameStore((s) => s.weeklyWins);
  const weeklyStreak = useGameStore((s) => s.weeklyStreak);

  const streakUnlocked = getHighestUnlocked(weeklyWins, weeklyStreak, 'streak');
  const streakNext = getNextReward(weeklyWins, weeklyStreak, 'streak');
  const winsUnlocked = getHighestUnlocked(weeklyWins, weeklyStreak, 'wins');
  const winsNext = getNextReward(weeklyWins, weeklyStreak, 'wins');

  return (
    <div
      className="rounded-xl border flex"
      style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
    >
      {/* Streak column */}
      <div className="flex-1 px-3 py-2.5 text-center">
        <div className="text-[11px] leading-[12px] tracking-[0.02em] uppercase font-title mb-1" style={{ color: 'var(--color-theme-text-tertiary)' }}>
          Streak
        </div>
        {streakUnlocked ? (
          <div className="text-[13px] leading-[18px] font-bold font-title flex items-center justify-center gap-1" style={{ color: 'var(--color-earned)' }}>
            <Icon name={streakUnlocked.icon} size={16} /> {streakUnlocked.prize}
          </div>
        ) : streakNext ? (
          <div className="text-[12px] leading-[16px] font-body" style={{ color: 'var(--color-theme-text-secondary)' }}>
            {streakNext.gapText} for {streakNext.tier.prize}
          </div>
        ) : (
          <div className="text-[12px] leading-[16px] font-body" style={{ color: 'var(--color-theme-text-secondary)' }}>
            All unlocked!
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px my-2" style={{ backgroundColor: 'var(--color-theme-border)' }} />

      {/* Wins column */}
      <div className="flex-1 px-3 py-2.5 text-center">
        <div className="text-[11px] leading-[12px] tracking-[0.02em] uppercase font-title mb-1" style={{ color: 'var(--color-theme-text-tertiary)' }}>
          Wins
        </div>
        {winsUnlocked ? (
          <div className="text-[13px] leading-[18px] font-bold font-title flex items-center justify-center gap-1" style={{ color: 'var(--color-earned)' }}>
            <Icon name={winsUnlocked.icon} size={16} /> {winsUnlocked.prize}
          </div>
        ) : winsNext ? (
          <div className="text-[12px] leading-[16px] font-body" style={{ color: 'var(--color-theme-text-secondary)' }}>
            {winsNext.gapText} for {winsNext.tier.prize}
          </div>
        ) : (
          <div className="text-[12px] leading-[16px] font-body" style={{ color: 'var(--color-theme-text-secondary)' }}>
            All unlocked!
          </div>
        )}
      </div>
    </div>
  );
}
