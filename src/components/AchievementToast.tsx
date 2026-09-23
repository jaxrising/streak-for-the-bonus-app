import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function AchievementToast() {
  const achievement = useGameStore((s) => s.newlyEarnedAchievement);
  const clearToast = useGameStore((s) => s.clearAchievementToast);

  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(clearToast, 4000);
    return () => clearTimeout(timer);
  }, [achievement, clearToast]);

  if (!achievement) return null;

  return (
    <div
      onClick={clearToast}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderRadius: 12,
        backgroundColor: '#252627',
        border: '1px solid rgba(255, 199, 44, 0.4)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        animation: 'fade-in-up 0.3s ease-out',
      }}
    >
      <img
        src={achievement.badgeImage}
        alt={achievement.title}
        style={{ width: 40, height: 40, objectFit: 'contain' }}
      />
      <div>
        <p style={{ color: '#FFC72C', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Achievement Unlocked
        </p>
        <p style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, margin: '2px 0 0' }}>
          {achievement.title}
        </p>
        <p style={{ color: '#a1a2a3', fontSize: 12, margin: '2px 0 0' }}>
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
