import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';
const SEEN_KEY = 'streak-htp-seen';

const cards = [
  {
    headline: 'Pick. Streak. Win.',
    body: 'Streak for the Bonus is a free daily prediction game. Make picks on real sports matchups and earn DraftKings Bonus Bets every week.',
    icon: '🏈',
  },
  {
    headline: 'One Pick at a Time',
    body: 'Choose a side on any available matchup—spreads, totals, player props, and more. Wait for your result, then pick again.',
    icon: '☝️',
  },
  {
    headline: 'Two Ways to Win Big',
    body: 'Longest Streak—The top weekly streak wins $10,000 in DK Bonus Bets.\nMost Wins—The most correct picks in a week also wins $10,000.',
    icon: '🏆',
  },
  {
    headline: 'Hit Thresholds, Earn Bonus Bets',
    body: 'Reach streak and win milestones each week to unlock $10, $15, and $25 in DraftKings Bonus Bets. No purchase necessary—ever.',
    icon: '🎁',
  },
];

/**
 * Info glyph for the header. 24px to match the back arrow, drawn on the same
 * 24-unit grid so the two optically align on the header's centre line —
 * a circle drawn on a 19.5 viewBox sits visibly high next to a 24px chevron.
 */
function InfoCircleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="7.4" r="1.15" fill="currentColor" />
      <path d="M12 10.9V17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/** Returns true if the user has never seen the How To Play flow */
function isFirstVisit(): boolean {
  try { return !localStorage.getItem(SEEN_KEY); } catch { return true; }
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
}

const TOOLTIP_KEY = SEEN_KEY + '-tooltip-dismissed';

export function HowToPlayButton() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(() => {
    if (USE_FIREBASE) return false;
    return isFirstVisit();
  });

  useEffect(() => {
    if (USE_FIREBASE && user && user.hasSeenHowToPlay === false) {
      setOpen(true);
    }
  }, [user]);

  const handleClose = async () => {
    setOpen(false);

    if (USE_FIREBASE && user) {
      await updateDoc(doc(db, 'users', user.uid), { hasSeenHowToPlay: true });
      useAuthStore.getState().setUser({ ...user, hasSeenHowToPlay: true });
    } else {
      markSeen();
    }

    window.dispatchEvent(new CustomEvent('htp-closed'));
  };

  /*
   * Renders inline in the header's right slot, not as a floating action
   * button. The FAB it replaced sat at bottom:90 right:20, which on a phone
   * parked it directly over the last pick card and just above the submit bar —
   * the two things the screen is actually for.
   *
   * The button is a 44px hit target (the kit's --gk-hit minimum) wrapped
   * around a 24px glyph, so it matches the back arrow optically while staying
   * thumb-sized. Negative margin keeps the extra padding from widening the
   * header row.
   */
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How to play"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          margin: '0 -10px 0 0',
          padding: 0,
          border: 'none',
          background: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
      >
        <InfoCircleIcon size={24} />
      </button>

      {open && <HowToPlayModal onClose={handleClose} />}
    </>
  );
}

export function PicksTooltip() {
  const [visible, setVisible] = useState(false);
  const pendingSelection = useGameStore((s) => s.pendingSelection);

  useEffect(() => {
    const show = () => {
      try {
        if (localStorage.getItem(TOOLTIP_KEY)) return;
      } catch {}
      setVisible(true);
    };
    window.addEventListener('htp-closed', show);
    return () => window.removeEventListener('htp-closed', show);
  }, []);

  useEffect(() => {
    if (pendingSelection && visible) {
      setVisible(false);
      try { localStorage.setItem(TOOLTIP_KEY, '1'); } catch {}
    }
  }, [pendingSelection, visible]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(TOOLTIP_KEY, '1'); } catch {}
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        animation: 'fade-in-up 0.3s ease-out both',
        marginBottom: 4,
      }}
    >
      {/* Tooltip body */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#FF9151',
          borderRadius: 10,
          padding: '10px 36px 10px 14px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.4,
          color: '#000000',
          margin: 0,
        }}>
          Make your first pick to start your streak!
        </p>

        {/* X close button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss tooltip"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.15)',
            color: '#000000',
            fontSize: 14,
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          &times;
        </button>
      </div>

      {/* Caret pointing down */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #FF9151',
          marginLeft: 20,
        }}
      />
    </div>
  );
}

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync dots with scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.clientWidth;
      const idx = Math.round(scrollLeft / cardWidth);
      setCurrent(Math.min(idx, cards.length - 1));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (idx: number) => {
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const isLast = current === cards.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          margin: '0 16px',
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: 'var(--color-theme-surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, fontWeight: 900, margin: 0 }}>
            HOW TO PLAY
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-theme-text-tertiary)',
              fontSize: 22,
              cursor: 'pointer',
              padding: '0 0 0 8px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Swipeable cards */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="scrollbar-hide"
        >
          {cards.map((card, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'center',
                padding: '12px 24px 20px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{card.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-title)',
                fontSize: 20,
                fontWeight: 700,
                margin: '0 0 8px',
                lineHeight: 1.2,
              }}>
                {card.headline}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--color-theme-text-secondary)',
                margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {/* Dots + action */}
        <div style={{ padding: '8px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Go to card ${i + 1}`}
                style={{
                  width: i === current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor: i === current ? 'var(--color-streak)' : 'var(--color-theme-text-muted)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              if (isLast) {
                onClose();
              } else {
                scrollTo(current + 1);
              }
            }}
            className="htp-cta"
            style={{
              width: '100%',
              height: 40,
              borderRadius: 100,
              border: 'none',
              fontFamily: 'var(--font-title)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'LET\'S GO' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  );
}
