import type { Achievement } from '../types';

export function AchievementCardLarge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className="flex-shrink-0 w-[160px] rounded-lg border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: achievement.earned ? 'rgba(255, 199, 44, 0.3)' : 'var(--color-theme-border)',
      }}
    >
      <div className="flex items-center justify-center pt-4 pb-2">
        <img
          src={achievement.badgeImage}
          alt={achievement.title}
          className={`w-[100px] h-[100px] object-contain ${achievement.earned ? '' : 'grayscale opacity-40'}`}
        />
      </div>
      <div className="px-2 pb-3 text-center">
        {achievement.earned && (
          <p className="text-[11px] leading-[14px] font-body mb-1" style={{ color: 'var(--color-theme-text-muted)' }}>
            Earned
          </p>
        )}
        <p
          className="text-[16px] leading-[20px] font-display font-bold italic uppercase truncate"
          style={{ color: achievement.earned ? 'var(--color-theme-text)' : 'var(--color-theme-text-muted)' }}
        >
          {achievement.title}
        </p>
      </div>
    </div>
  );
}

export function AchievementGridItem({ achievement }: { achievement: Achievement }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[84px] h-[84px] mb-1">
        <img
          src={achievement.badgeImage}
          alt={achievement.title}
          className={`w-full h-full object-contain ${achievement.earned ? '' : 'grayscale opacity-30'}`}
        />
      </div>
      <p
        className="text-[12px] leading-[14px] font-body text-center w-full"
        style={{ color: 'var(--color-theme-text-muted)' }}
      >
        {achievement.title}
      </p>
    </div>
  );
}
