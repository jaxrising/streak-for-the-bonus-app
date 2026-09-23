import type { RewardTier } from '../types';
import { useGameStore } from '../store/gameStore';
import { Icon } from './icons';

export default function RewardTierCard({ tier, index }: { tier: RewardTier; index: number }) {
  const weeklyWins = useGameStore((s) => s.weeklyWins);
  const weeklyStreak = useGameStore((s) => s.weeklyStreak);
  const current = tier.type === 'streak' ? weeklyStreak : weeklyWins;
  const unlocked = current >= tier.threshold;

  return (
    <div
      className="relative border rounded-xl p-5 transition-all duration-300 animate-fade-in-up"
      style={{
        animationDelay: `${index * 100}ms`,
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: unlocked ? 'var(--color-earned)' : 'var(--color-theme-border)',
        boxShadow: unlocked ? '0 0 15px color-mix(in srgb, var(--color-earned) 15%, transparent)' : 'none',
        opacity: unlocked ? 1 : 0.7,
      }}
    >
      {unlocked && (
        <div className="absolute top-3 right-3 text-[11px] leading-[12px] tracking-[0.02em] font-bold font-title text-status-success bg-status-success/10 px-2 py-1 rounded-full">
          UNLOCKED
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: unlocked ? 'var(--color-theme-text)' : 'var(--color-theme-text-muted)' }}><Icon name={tier.icon} size={32} /></span>
        <span
          className="text-[10px] leading-[12px] tracking-[0.04em] uppercase font-bold font-title px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: tier.type === 'streak' ? 'color-mix(in srgb, var(--color-streak) 10%, transparent)' : 'color-mix(in srgb, var(--color-wins) 10%, transparent)',
            color: tier.type === 'streak' ? 'var(--color-streak)' : 'var(--color-wins)',
          }}
        >
          {tier.type}
        </span>
      </div>
      <h3
        className="text-[18px] leading-[24px] font-bold font-title mb-1"
        style={{ color: unlocked ? 'var(--color-theme-text)' : 'var(--color-theme-text-muted)' }}
      >
        {tier.title}
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--color-theme-text-tertiary)' }}>{tier.description}</p>
      <div
        className="text-[14px] leading-[20px] font-bold font-title"
        style={{ color: unlocked ? 'var(--color-earned)' : 'var(--color-theme-text-muted)' }}
      >
        {tier.prize}
      </div>
    </div>
  );
}
