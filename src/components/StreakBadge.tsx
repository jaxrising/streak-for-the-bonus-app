import type { ReactNode } from 'react';

interface StatBadgeProps {
  value: number;
  label: string;
  icon: ReactNode;
  pulse?: boolean;
}

export default function StreakBadge({ value, label, icon, pulse }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={pulse ? 'animate-streak-pulse' : ''} style={{ color: 'var(--color-theme-text)' }}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-display font-black tabular-nums" style={{ color: 'var(--color-theme-text)' }}>{value}</div>
        <div className="text-[12px] leading-[14px] tracking-[0.02em] uppercase font-title" style={{ color: 'var(--color-theme-text-tertiary)' }}>{label}</div>
      </div>
    </div>
  );
}
