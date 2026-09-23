import { useGameStore } from '../store/gameStore';
import { getNextReward } from '../data/rewards';

function DKCrownLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9.5 8.5L3 7L6 13L3 21H21L18 13L21 7L14.5 8.5L12 2Z" />
      <circle cx="12" cy="15" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function getFireState(streak: number): 'idle' | 'warm' | 'hot' | 'blazing' | 'inferno' {
  if (streak >= 10) return 'inferno';
  if (streak >= 7) return 'blazing';
  if (streak >= 5) return 'hot';
  if (streak >= 3) return 'warm';
  return 'idle';
}

interface ProgressPipsProps {
  current: number;
  next: { tier: { threshold: number; prize: string }; gap: number; gapText: string } | null;
  color: string;
}

function ProgressPips({ current, next, color }: ProgressPipsProps) {
  if (!next) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <DKCrownLogo size={12} />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-earned)' }}>
          All milestones unlocked!
        </span>
      </div>
    );
  }

  const { tier } = next;
  const threshold = tier.threshold;
  const pips = Array.from({ length: threshold }, (_, i) => i + 1);
  const pipSize = threshold > 6 ? 7 : 9;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap', overflow: 'hidden' }}>
      {pips.map((pip) => {
        const filled = pip <= current;
        return (
          <div
            key={pip}
            style={{
              width: pipSize,
              height: pipSize,
              borderRadius: '50%',
              backgroundColor: filled ? color : 'transparent',
              border: `1.5px solid ${filled ? color : 'var(--color-theme-border-hover)'}`,
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
          />
        );
      })}
      <div style={{ width: 1, height: 14, backgroundColor: 'var(--color-theme-border)', margin: '0 3px', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }} className="entry-card__dk-logo">
        <DKCrownLogo size={12} />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--color-theme-text-secondary)', whiteSpace: 'nowrap' }}>
          {tier.prize}
        </span>
      </div>
    </div>
  );
}

export default function EntryCard() {
  const weeklyWins = useGameStore((s) => s.weeklyWins);
  const weeklyStreak = useGameStore((s) => s.weeklyStreak);
  const longestWeeklyStreak = useGameStore((s) => s.longestWeeklyStreak);

  const streakNext = getNextReward(weeklyWins, weeklyStreak, 'streak');
  const winsNext = getNextReward(weeklyWins, weeklyStreak, 'wins');
  const fireState = getFireState(weeklyStreak);

  return (
    <div
      className={`entry-card entry-card--${fireState} relative rounded-xl overflow-hidden border`}
      style={{
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: fireState === 'idle' ? 'var(--color-theme-border)' : undefined,
      }}
    >
      {/* Fire particle layers */}
      {fireState !== 'idle' && (
        <>
          <div className="entry-card__embers" />
          {(fireState === 'blazing' || fireState === 'inferno') && (
            <div className="entry-card__flames" />
          )}
          {fireState === 'inferno' && (
            <div className="entry-card__inferno" />
          )}
        </>
      )}

      <div className="relative z-10 px-4 py-3">
        <div className="flex gap-4">

          {/* ── STREAK section ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="text-[10px] leading-[12px] tracking-[0.08em] uppercase font-title font-bold mb-2"
              style={{ color: 'var(--color-theme-text-tertiary)' }}
            >
              Streak
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-[32px] leading-[36px] font-black font-display tabular-nums"
                style={{ color: 'var(--color-streak)' }}
              >
                {weeklyStreak}
              </span>
              {longestWeeklyStreak > 0 && (
                <span className="text-[11px] font-body" style={{ color: 'var(--color-theme-text-muted)' }}>
                  Best: {longestWeeklyStreak}
                </span>
              )}
            </div>
            <ProgressPips current={weeklyStreak} next={streakNext} color="var(--color-streak)" />
          </div>

          {/* Vertical divider */}
          <div className="w-px self-stretch" style={{ backgroundColor: 'var(--color-theme-border)' }} />

          {/* ── MOST WINS section ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="text-[10px] leading-[12px] tracking-[0.08em] uppercase font-title font-bold mb-2"
              style={{ color: 'var(--color-theme-text-tertiary)' }}
            >
              Most Wins
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-[32px] leading-[36px] font-black font-display tabular-nums"
                style={{ color: 'var(--color-wins)' }}
              >
                {weeklyWins}
              </span>
              <span className="text-[11px] font-body" style={{ color: 'var(--color-theme-text-muted)' }}>
                this week
              </span>
            </div>
            <ProgressPips current={weeklyWins} next={winsNext} color="var(--color-wins)" />
          </div>

        </div>
      </div>
    </div>
  );
}
