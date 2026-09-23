import { useGameStore } from '../store/gameStore';
import { formatTimeAgo } from '../lib/formatters';
import SportIcon from './SportIcon';

export default function PickHistoryList() {
  const pickHistory = useGameStore((s) => s.pickHistory);

  if (pickHistory.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--color-theme-text-muted)' }}>
        No picks yet. Make your first pick!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pickHistory.map((pick, i) => (
        <div
          key={pick.id}
          className="flex items-center gap-3 border rounded-xl p-3 animate-fade-in-up"
          style={{
            animationDelay: `${i * 40}ms`,
            backgroundColor: 'var(--color-theme-surface)',
            borderColor: 'var(--color-theme-border)',
          }}
        >
          <SportIcon league={pick.league || pick.sport} />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate" style={{ color: 'var(--color-theme-text-secondary)' }}>{pick.question}</div>
            <div className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>{pick.chosenOption}</div>
          </div>
          <div className="text-right">
            <div
              className={`text-xs font-bold font-title ${
                pick.status === 'won' ? 'text-status-success' : pick.status === 'lost' ? 'text-status-error' : ''
              }`}
              style={pick.status === 'pending' ? { color: 'var(--color-theme-text-tertiary)' } : undefined}
            >
              {pick.status.toUpperCase()}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>{formatTimeAgo(pick.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
