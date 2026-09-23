import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { offerings } from '../data/offerings';
import { getResolveDelay } from '../lib/resolution';

export default function ActivePickBanner() {
  const activePick = useGameStore((s) => s.activePick);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const prevPickRef = useRef(activePick);

  useEffect(() => {
    if (activePick && !prevPickRef.current) {
      setExiting(false);
      requestAnimationFrame(() => setVisible(true));
    } else if (!activePick && prevPickRef.current) {
      setExiting(true);
      setVisible(false);
      const timer = setTimeout(() => setExiting(false), 400);
      prevPickRef.current = activePick;
      return () => clearTimeout(timer);
    }
    prevPickRef.current = activePick;
  }, [activePick]);

  if (!activePick && !exiting) return null;

  const offering = offerings.find((o) => o.id === (activePick ?? prevPickRef.current)?.offeringId);
  const pick = activePick ?? prevPickRef.current;
  const resolveDelay = offering ? getResolveDelay(offering) : 5000;

  return (
    <div
      className="toast-anchor fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ padding: '0 16px 20px' }}
    >
      <div
        className={`toast-card pointer-events-auto overflow-hidden ${visible ? 'toast-visible' : 'toast-hidden'}`}
        style={{
          backgroundColor: 'var(--color-theme-surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-theme-border)',
        }}
      >
        {/* Content */}
        <div className="toast-content">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] leading-[14px] tracking-[0.02em] font-title" style={{ color: 'var(--color-streak)' }}>
                Resolving Pick
              </span>
            </div>
            <div className="toast-pick-text text-[14px] leading-[20px] font-medium truncate mt-0.5" style={{ color: 'var(--color-theme-text)' }}>
              {pick?.chosenOption}
            </div>
            <div className="toast-question-text text-[11px] leading-[12px] tracking-[0.02em] truncate mt-0.5" style={{ color: 'var(--color-theme-text-muted)' }}>
              {offering?.question}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[3px] w-full" style={{ backgroundColor: 'var(--color-theme-border)' }}>
          {activePick && (
            <div
              className="h-full rounded-r-full"
              style={{
                background: 'linear-gradient(to right, #05A569, #796122)',
                animation: `countdown-bar ${resolveDelay}ms linear forwards`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
