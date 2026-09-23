import { useEffect, useMemo, useRef } from 'react';
import { getPeriodDays, getPeriodWeekLabel } from '../lib/weekUtils';

/**
 * Period nav — seven days, Tuesday through Monday.
 *
 * Built from the ESPN Design System Date Picker
 * (Sizing=Compact, Type=Limited, node 809:78419), Code Connected to this file.
 * The selected cell follows the Active `.Calendar Selectors` variant
 * (node 809:78444).
 *
 * FROM THE DESIGN SYSTEM
 *   cell        min-w 76px / max-w 90px, px 24px, py 8px, radius 8px (--soft)
 *   stack       vertical, 2px gap, centred
 *   title       Label Medium  12px / 14px line / 0.24px tracking
 *   subtitle    Label Small   11px / 12px line / 0.22px tracking
 *   weight      400 base, 500 emphasised when active
 *   active      subtle alpha fill (--interaction/alpha/default)
 *               + a 3px _Line Indicator pinned to the bottom edge,
 *                 bottom:-1px inside an overflow-clip button so it reads
 *                 flush rather than floating
 *
 * Type=Limited means the row shows a few days and scrolls — which is why the
 * cells carry a min-width. An earlier pass squeezed all seven into 390px by
 * dropping that; scrolling is now allowed, so the DS dimensions are intact
 * and the row scrolls horizontally as designed.
 *
 * ONE ADAPTATION: the DS palette is light, so `--interaction/alpha/default`
 * lands as a pale grey and the indicator is near-black (#121212). Streak is
 * dark, so both invert — a white alpha fill (the same 8% white the kit uses
 * for `surface-raised`) and a white indicator. The token's *role* is kept;
 * only the polarity flips.
 */

/** DS: --component/spacing/large */
const CELL_PX = 24;
/** DS: --component/spacing/small */
const CELL_PY = 8;
/** DS: --soft */
const RADIUS = 8;

interface CalendarSelectorProps {
  /** Label Medium — "MON" */
  title: string;
  /** Label Small — "Sep 22" */
  subtitle: string;
  state: 'active' | 'default' | 'unavailable';
  onClick: () => void;
  isToday?: boolean;
  ariaLabel: string;
}

export function CalendarSelector({
  title,
  subtitle,
  state,
  onClick,
  isToday,
  ariaLabel,
}: CalendarSelectorProps) {
  const active = state === 'active';
  const unavailable = state === 'unavailable';

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      data-day-cell={active ? 'active' : undefined}
      className="relative shrink-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        minWidth: 76,
        maxWidth: 90,
        paddingLeft: CELL_PX,
        paddingRight: CELL_PX,
        paddingTop: CELL_PY,
        paddingBottom: CELL_PY,
        gap: 2,
        borderRadius: RADIUS,
        // --interaction/alpha/default, inverted for a dark ground
        backgroundColor: active ? 'var(--color-theme-surface-raised)' : 'transparent',
        // Days with nothing on them stay tappable — they explain the gap in
        // the week — but read as unavailable rather than merely unselected.
        opacity: unavailable && !active ? 0.35 : 1,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        className="font-body whitespace-nowrap"
        style={{
          fontSize: 12,
          lineHeight: '14px',
          letterSpacing: '0.24px',
          fontWeight: active ? 500 : 400,
          color: 'var(--color-theme-text)',
        }}
      >
        {title}
      </span>
      <span
        className="font-body whitespace-nowrap"
        style={{
          fontSize: 11,
          lineHeight: '12px',
          letterSpacing: '0.22px',
          fontWeight: active ? 500 : 400,
          color: active ? 'var(--color-theme-text)' : 'var(--color-theme-text-tertiary)',
        }}
      >
        {subtitle}
      </span>

      {/* _Line Indicator — DS node I809:78444;6983:52323 */}
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 3,
            borderRadius: RADIUS,
            backgroundColor: 'var(--color-theme-text)',
          }}
        />
      )}

      {/* Today marker, shown only when some other day is selected. */}
      {isToday && !active && (
        <span
          className="absolute bottom-[3px] w-1 h-1 rounded-full"
          style={{ backgroundColor: 'var(--color-theme-text-tertiary)' }}
        />
      )}
    </button>
  );
}

function CalendarIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="11" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.75 6.5h12.5M5.25 1.75v2.5M10.75 1.75v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface PeriodNavProps {
  selected: string;
  onSelect: (dayKey: string) => void;
  /** dayKey -> number of questions available that day */
  counts: Record<string, number>;
}

export default function PeriodNav({ selected, onSelect, counts }: PeriodNavProps) {
  const days = useMemo(() => getPeriodDays(), []);
  const label = useMemo(() => getPeriodWeekLabel(), []);
  const scroller = useRef<HTMLDivElement>(null);

  /*
   * Bring the selected day into view.
   *
   * The row scrolls, so on a Sunday the selected cell starts off-screen to
   * the right and the nav looks like it opens on Tuesday. Scrolls the
   * container only — `scrollIntoView` on the cell would also scroll the page.
   */
  useEffect(() => {
    const box = scroller.current;
    const cell = box?.querySelector<HTMLElement>('[data-day-cell="active"]');
    if (!box || !cell) return;
    const target = cell.offsetLeft - (box.clientWidth - cell.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [selected]);

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
    >
      {/* Show Calendar Icon = true on the mapped variant */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-theme-border)', color: 'var(--color-theme-text-tertiary)' }}
      >
        <CalendarIcon />
        <span
          className="font-body"
          style={{ fontSize: 11, lineHeight: '12px', letterSpacing: '0.22px', fontWeight: 500 }}
        >
          {label}
        </span>
      </div>

      <div
        ref={scroller}
        className="flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {days.map((d) => {
          const count = counts[d.key] ?? 0;
          return (
            <div key={d.key} style={{ scrollSnapAlign: 'center' }}>
              <CalendarSelector
                title={d.abbr}
                subtitle={`${MONTHS[d.date.getMonth()]} ${d.dayOfMonth}`}
                state={d.key === selected ? 'active' : count === 0 ? 'unavailable' : 'default'}
                isToday={d.isToday}
                onClick={() => onSelect(d.key)}
                ariaLabel={`${d.abbr} ${MONTHS[d.date.getMonth()]} ${d.dayOfMonth}, ${count} question${count === 1 ? '' : 's'}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
