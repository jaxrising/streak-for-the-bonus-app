import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/** Plain-text toast — same slot and timing as AchievementToast, no badge. */
export default function InfoToast() {
  const message = useGameStore((s) => s.futureDayNotice);
  const clear = useGameStore((s) => s.clearFutureDayNotice);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 3000);
    return () => clearTimeout(timer);
  }, [message, clear]);

  if (!message) return null;

  return (
    <div
      onClick={clear}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: 'calc(100vw - 32px)',
        padding: '12px 20px',
        borderRadius: 12,
        backgroundColor: '#252627',
        border: '1px solid var(--color-theme-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        animation: 'fade-in-up 0.3s ease-out',
      }}
    >
      <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, margin: 0, textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}
