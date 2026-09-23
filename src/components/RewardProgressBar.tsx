import type { RewardTier } from '../types';
import { Icon } from './icons';
import { FireFlameIcon } from './icons';

interface RewardProgressBarProps {
  type: 'streak' | 'wins';
  currentValue: number;
  tiers: RewardTier[];
  label: string;
}

export default function RewardProgressBar({ type, currentValue, tiers, label }: RewardProgressBarProps) {
  const maxThreshold = tiers[tiers.length - 1].threshold;
  const progress = Math.min((currentValue / maxThreshold) * 100, 100);
  const gradient = type === 'streak'
    ? 'linear-gradient(to right, #05A569, #796122)'
    : 'linear-gradient(to right, #FF9151, #A1562C)';
  const activeColor = type === 'streak' ? 'var(--color-streak)' : 'var(--color-wins)';

  return (
    <div
      className="border rounded-xl p-5"
      style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] leading-[20px] font-title" style={{ color: 'var(--color-theme-text-tertiary)' }}>{label}</span>
        <span className="text-[14px] leading-[20px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>
          {currentValue} / {maxThreshold} {type === 'streak' ? 'streak' : 'wins'}
        </span>
      </div>

      <div className="relative h-3 rounded-full overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-theme-bg)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ background: gradient, width: `${progress}%` }}
        />
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="absolute top-0 h-full w-0.5"
            style={{ left: `${(tier.threshold / maxThreshold) * 100}%`, backgroundColor: 'var(--color-theme-border-hover)' }}
          />
        ))}
      </div>

      <div className="flex justify-between">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="text-center"
            style={{ color: currentValue >= tier.threshold ? activeColor : 'var(--color-theme-text-muted)' }}
          >
            <div><Icon name={tier.icon} size={22} /></div>
            <div className="text-xs mt-0.5 flex items-center justify-center gap-0.5">{tier.threshold}{type === 'streak' ? <FireFlameIcon size={10} /> : 'W'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
