import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Icon } from './icons';

/**
 * The reward moment.
 *
 * SIMULATION ONLY. Real bonus bets are regulated promotional credits — this
 * awards nothing, touches no DraftKings system, and exists so the beat can be
 * felt before anyone commits to building it. Anything real needs the
 * compliance path first. The copy says "simulated" on the face of the card
 * for that reason; it is not placeholder text to tidy up later.
 *
 * Shape of the beat, in order:
 *   0ms    scrim fades, everything behind blurs back
 *   80ms   card springs in (--gk-ease-spring, the one celebratory curve)
 *   260ms  the amount counts up
 *   300ms  confetti fires once
 *   —      it waits. The dismissal is a tap, never a timer.
 *
 * That last point is the design. An achievement toast auto-dismisses after 4s
 * because it is an interruption. A reward is the thing the player has been
 * grinding toward for seven picks, and yanking it off screen on a timer
 * undercuts the only moment in the loop that is purely a payoff. It also
 * makes the beat impossible to actually evaluate, which is the point here.
 */

const CONFETTI_COUNT = 28;
const CONFETTI_COLORS = ['#05A569', '#FF9151', '#FFFFFF', '#51FF77', '#5990f6'];

function Confetti() {
  // Positions are generated once so a re-render does not re-scatter them.
  const pieces = useRef(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 260,
      duration: 1400 + Math.random() * 900,
      size: 5 + Math.random() * 6,
      rotate: Math.random() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: Math.random() > 0.6,
    }))
  ).current;

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 20 }}>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: -12,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.6),
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 1,
            transform: `rotate(${p.rotate}deg)`,
            animation: `award-fall ${p.duration}ms cubic-bezier(.22,.61,.36,1) ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}

/** Counts 0 -> value. Tabular figures keep the layout from jittering. */
function CountUp({ value, duration = 620 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // ease-out cubic — fast then settling, matches the spring on the card
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>${n}</span>;
}

export default function BonusBetAward() {
  const award = useGameStore((s) => s.pendingAward);
  const clear = useGameStore((s) => s.clearAward);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!award) {
      setShown(false);
      return;
    }
    // Next frame, so the entry transition actually runs rather than the card
    // simply existing in its final state on first paint.
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [award]);

  useEffect(() => {
    if (!award) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && clear();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [award, clear]);

  if (!award) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${award.prize} awarded`}
      onClick={clear}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        opacity: shown ? 1 : 0,
        transition: 'opacity 220ms var(--gk-ease-out, ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 340,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: 'var(--color-theme-surface)',
          border: '1px solid color-mix(in srgb, var(--color-streak) 45%, transparent)',
          boxShadow: '0 0 40px color-mix(in srgb, var(--color-streak) 22%, transparent), 0 18px 50px rgba(0,0,0,0.6)',
          transform: shown ? 'scale(1) translateY(0)' : 'scale(0.86) translateY(14px)',
          opacity: shown ? 1 : 0,
          transition:
            'transform 460ms var(--gk-ease-spring, cubic-bezier(.34,1.42,.64,1)) 80ms, opacity 240ms ease-out 80ms',
        }}
      >
        {shown && <Confetti />}

        <div style={{ position: 'relative', padding: '28px 24px 22px', textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-streak)',
            }}
          >
            Bonus Bet Unlocked
          </p>

          <div
            style={{
              margin: '14px auto 10px',
              width: 62,
              height: 62,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-streak)',
              background: 'color-mix(in srgb, var(--color-streak) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-streak) 35%, transparent)',
            }}
          >
            <Icon name={award.icon} size={30} />
          </div>

          <p
            style={{
              margin: '0 0 2px',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 900,
              fontSize: 46,
              lineHeight: 1,
              color: 'var(--color-theme-text)',
            }}
          >
            <CountUp value={award.prizeValue} />
          </p>
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-title)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-theme-text)',
            }}
          >
            DraftKings Bonus Bet
          </p>

          <p
            style={{
              margin: '0 0 4px',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-theme-text)',
            }}
          >
            {award.title}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.45,
              color: 'var(--color-theme-text-secondary)',
            }}
          >
            {award.description}
          </p>

          <button
            onClick={clear}
            className="htp-cta"
            style={{
              marginTop: 20,
              width: '100%',
              height: 44,
              borderRadius: 100,
              border: 'none',
              fontFamily: 'var(--font-title)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.03em',
              cursor: 'pointer',
            }}
          >
            NICE
          </button>

          {/*
            Not fine print for its own sake. This screen shows a dollar figure
            next to a sportsbook's name, which is exactly the thing that must
            not be mistakable for a real credit in a prototype that will get
            passed around.
          */}
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              lineHeight: 1.4,
              color: 'var(--color-theme-text-muted)',
            }}
          >
            Simulated reward — prototype only. No credit has been issued.
          </p>
        </div>
      </div>
    </div>
  );
}
