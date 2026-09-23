import type { LeaderboardUser } from '../types';
import { FireFlameIcon } from './icons';

type TimeFrame = 'daily' | 'weekly' | 'allTime';
type Category = 'streak' | 'wins' | 'winPct';

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  timeFrame: TimeFrame;
  category: Category;
}

function getValue(user: LeaderboardUser, timeFrame: TimeFrame, category: Category): number {
  if (category === 'streak') {
    return user.weeklyStreak;
  }
  if (category === 'winPct') {
    const wins = timeFrame === 'daily' ? user.dailyWins : timeFrame === 'weekly' ? user.weeklyWins : user.allTimeWins;
    const picks = timeFrame === 'daily' ? user.dailyPicks : timeFrame === 'weekly' ? user.weeklyPicks : user.allTimePicks;
    return picks > 0 ? wins / picks : 0;
  }
  if (timeFrame === 'daily') return user.dailyWins;
  if (timeFrame === 'weekly') return user.weeklyWins;
  return user.allTimeWins;
}

function formatValue(value: number, category: Category): string {
  if (category === 'winPct') {
    return `${Math.round(value * 100)}%`;
  }
  return String(value);
}

function getSubLabel(timeFrame: TimeFrame, category: Category): string {
  if (category === 'streak') return 'streak';
  if (category === 'winPct') return 'win rate';
  if (timeFrame === 'daily') return 'today';
  if (timeFrame === 'weekly') return 'weekly';
  return 'all-time';
}

export default function LeaderboardTable({ users, timeFrame, category }: LeaderboardTableProps) {
  const sorted = [...users].sort((a, b) => getValue(b, timeFrame, category) - getValue(a, timeFrame, category));

  return (
    <div className="space-y-2">
      {sorted.map((user, i) => {
        const value = getValue(user, timeFrame, category);
        return (
          <div
            key={user.username}
            className="flex items-center gap-3 p-3 rounded-xl transition-all animate-fade-in-up border"
            style={{
              backgroundColor: user.isCurrentUser ? 'var(--color-theme-surface-alt)' : 'var(--color-theme-surface)',
              borderColor: user.isCurrentUser ? 'var(--color-theme-text)' : 'var(--color-theme-border)',
            }}
            data-delay={`${i * 50}ms`}
          >
            <div className="w-8 text-center text-[16px] leading-[24px] font-bold font-title" style={{ color: 'var(--color-theme-text-tertiary)' }}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] leading-[20px] font-medium truncate"
                style={{ color: 'var(--color-theme-text)', fontWeight: user.isCurrentUser ? 700 : 500 }}
              >
                {user.username}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>
                <span className="inline-flex items-center gap-0.5"><FireFlameIcon size={12} /> {user.weeklyStreak} streak</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[18px] leading-[24px] font-bold tabular-nums font-title" style={{ color: 'var(--color-theme-text)' }}>
                {formatValue(value, category)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>
                {getSubLabel(timeFrame, category)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
