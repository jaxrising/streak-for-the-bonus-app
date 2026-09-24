import type { Offering, PickSide } from '../types';
import { useGameStore } from '../store/gameStore';
import { etDayKey, formatDayLabelET } from '../lib/timeFormat';
import SportIcon from './SportIcon';

interface PickCardProps {
  offering: Offering;
  index: number;
}

const HEADSHOT_SPORTS = new Set(['Golf']);

/**
 * Status mark for a resolved pick — FIRE's "Status Marks" slot.
 *
 * Filled disc plus a glyph, so it survives greyscale and colour-blindness:
 * a check and a cross differ by SHAPE, not only by green versus red. Red and
 * green is the single worst pairing to rely on for deuteranopia, and a
 * win/loss marker is exactly the kind of thing people screenshot and share.
 */
function LockMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size * 0.86} height={size} viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path
        d="M9.5 6H9V4.5C9 2.57 7.43 1 5.5 1C3.57 1 2 2.57 2 4.5V6H1.5C0.95 6 0.5 6.45 0.5 7V12.5C0.5 13.05 0.95 13.5 1.5 13.5H9.5C10.05 13.5 10.5 13.05 10.5 12.5V7C10.5 6.45 10.05 6 9.5 6ZM5.5 10.5C4.95 10.5 4.5 10.05 4.5 9.5C4.5 8.95 4.95 8.5 5.5 8.5C6.05 8.5 6.5 8.95 6.5 9.5C6.5 10.05 6.05 10.5 5.5 10.5ZM7.5 6H3.5V4.5C3.5 3.4 4.4 2.5 5.5 2.5C6.6 2.5 7.5 3.4 7.5 4.5V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Marks the option that actually won. Shown on every settled card.
 *
 * The tone carries whether the player was involved:
 *
 *   grey   they did not pick this one — the mark states the outcome without
 *          implying a result they never earned
 *   green  they did pick it, so the mark is also the answer key
 *
 * Showing it on picked cards too is what makes a LOSS legible. Before, an
 * incorrect pick showed a red cross on your choice and nothing else, so the
 * card told you that you were wrong without ever telling you what was right.
 */
type RowMark = 'correct' | 'incorrect' | 'winner';

/**
 * Outcome mark on a pick row.
 *
 *   correct    you picked this and it landed        green check
 *   incorrect  you picked this and it did not       red cross
 *   winner     nobody picked it; this is what won   grey check
 *
 * ABSOLUTELY POSITIONED on purpose. It used to sit in the flex row before the
 * stat text, so on a card with "missed in 54" beside it the mark was pushed
 * ~190px left of where it sat on a card without one. Pinning it to the row's
 * right edge means every mark on the board lands on the same x, and the stat
 * text is given padding to clear it rather than competing for the space.
 *
 * Check and cross differ by SHAPE as well as colour — red/green alone is the
 * worst possible pairing for deuteranopia, and this is the one glyph on the
 * card carrying the result.
 */
function OutcomeMark({ mark }: { mark: RowMark }) {
  const bg =
    mark === 'correct'
      ? 'var(--color-status-success)'
      : mark === 'incorrect'
      ? 'var(--color-status-error)'
      : 'rgba(255,255,255,0.28)';
  const fg = mark === 'winner' ? '#F9F9FB' : '#000000';
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: bg,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        {mark === 'incorrect' ? (
          <path d="M3.2 3.2L8.8 8.8M8.8 3.2L3.2 8.8" stroke={fg} strokeWidth="1.9" strokeLinecap="round" />
        ) : (
          <path d="M2.5 6.2L4.9 8.6L9.5 3.8" stroke={fg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

function PickButton({
  label,
  shortLabel,
  abbrLabel,
  pickPct,
  stat,
  image,
  color,
  isHeadshot,
  isSelected,
  isDisabled,
  ringColor,
  desaturate,
  mark,
  keepClickable,
  onClick,
}: {
  label: string;
  shortLabel?: string;
  abbrLabel?: string;
  pickPct?: number;
  /**
   * Pre-submit stat line, e.g. "4 of 7 games".
   *
   * The right-hand slot used to render only after submit, showing pick %.
   * Milestone props have no price to show, so this is what goes in its place
   * while the pick is still live — and it is arguably a better number than a
   * price was: it states why the question is interesting rather than
   * encoding it.
   */
  stat?: string;
  image?: string;
  color?: string;
  isHeadshot: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  /** Ring colour for the marked side — white while live, result colour once graded. */
  ringColor?: string;
  /** Grey the option out: the question resolved and the player never answered it. */
  desaturate?: boolean;
  /** Outcome mark for this side, or undefined to leave it unmarked. */
  mark?: RowMark;
  /**
   * Stay a real click target despite `isDisabled` styling.
   *
   * A future-day card is disabled — there is nothing to select yet — but a
   * native `disabled` button swallows the tap entirely, so there was no way
   * to tell the player WHY. This keeps the tap live so onClick can surface
   * that reason instead of doing nothing.
   */
  keepClickable?: boolean;
  onClick: () => void;
}) {
  const muted = isDisabled && !isSelected;
  const textColor = muted ? '#6C6D6F' : '#FFFFFF';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled && !keepClickable}
      className={`relative flex items-center h-[56px] rounded-lg overflow-visible text-[14px] leading-[18px] font-bold font-title transition-all duration-200 disabled:cursor-not-allowed ${
        isSelected ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: '#252627',
        // Drains the team colour out of the glow and the logo, so an
        // unanswered question reads as settled history rather than as a live
        // choice you could still make.
        filter: desaturate ? 'grayscale(1)' : undefined,
        cursor: isDisabled && keepClickable ? 'pointer' : undefined,
        ...(isSelected ? { '--tw-ring-color': ringColor ?? '#FFFFFF' } as React.CSSProperties : {}),
      }}
    >
      {/* Glow container — width scales to pick percentage after submit */}
      {color && (
        <div
          className="absolute left-0 top-0 bottom-0 shrink-0 pointer-events-none transition-all duration-700 ease-out overflow-hidden rounded-lg"
          style={{ width: pickPct != null ? `${pickPct}%` : '112px' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${color}80 0%, ${color}30 40%, transparent 100%)`,
            }}
          />
        </div>
      )}

      {/* Logo area — fixed 80px zone */}
      {image && !isHeadshot && (
        <div className="absolute left-[20px] top-[8px] w-[40px] h-[40px] z-10">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      {image && isHeadshot && (
        <img
          src={image}
          alt=""
          className="absolute left-0 top-0 h-full w-[80px] object-cover object-top z-10"
        />
      )}

      {/* Team name — three variants toggled by container queries.
          Left padding only clears the logo zone when there is a logo; Yes/No
          milestone cards have no per-side art and would otherwise open with
          an 80px hole. */}
      <span
        className={`relative z-10 flex-1 text-left min-w-0 ${image ? 'pl-[80px]' : 'pl-[20px]'}`}
        style={{ color: textColor }}
      >
        <span className="team-name-full block truncate">{label}</span>
        <span className="team-name-short block truncate">{shortLabel || label}</span>
        <span className={`team-name-abbr block ${isHeadshot ? 'truncate' : 'whitespace-nowrap'}`}>{abbrLabel || (shortLabel || label)}</span>
      </span>

      {mark && <OutcomeMark mark={mark} />}

      {/* Stats area — right-aligned.
          Before submit: the stat line, where there is one.
          After submit:  pick %, as before. */}
      {(pickPct != null || stat) && (
        <div
          className="relative z-10 flex flex-col items-end shrink-0 pl-2 gap-[4px]"
          // Clear the absolutely-positioned mark so the stat text never sits
          // underneath it.
          style={{ overflow: 'visible', paddingRight: mark ? 44 : 24 }}
        >
          <span
            className="text-[10px] leading-[12px] font-body font-normal tabular-nums whitespace-nowrap"
            style={{ color: textColor }}
          >
            {pickPct != null ? `${pickPct}% picked` : stat}
          </span>
        </div>
      )}
    </button>
  );
}

export default function PickCard({ offering, index }: PickCardProps) {
  const { pendingSelection, submitted, submittedPick, selectPick, pickHistory, showFutureDayNotice } = useGameStore();
  const activeSelection = submitted ? submittedPick : pendingSelection;
  const isLocked = offering.startTimeISO ? new Date(offering.startTimeISO) <= new Date() : false;
  /*
   * Streak is one pick at a time — the day nav lets a player look ahead to
   * Friday's slate from a Tuesday, but locking that pick in five days early
   * would tie up their only active pick on a game that has not moved yet.
   * Viewing stays open; picking opens on the game's own ET calendar day.
   */
  const isFutureDay = offering.startTimeISO ? etDayKey(offering.startTimeISO) > etDayKey(new Date()) : false;
  const isDisabled = submitted || isLocked || isFutureDay;
  const isHeadshot = HEADSHOT_SPORTS.has(offering.sport) && !offering.noSideArt;

  /*
   * Moneyline price, shown in the same pre-submit slot a total/milestone
   * card uses for its stat line. The odds were always computed
   * (buildLineOfferings sets oddsA/oddsB) but never rendered anywhere, so a
   * team-v-team card showed a real DraftKings price nowhere on it.
   */
  const displayStatA = offering.kind === 'moneyline' ? offering.oddsA : offering.statA;
  const displayStatB = offering.kind === 'moneyline' ? offering.oddsB : offering.statB;

  /*
   * Did the player pick this one, and did it land?
   *
   * Read from pickHistory rather than from the offering, because the result
   * belongs to the player's record, not to the matchup. Most locked cards
   * have no record at all — Streak is one pick at a time, so on any given day
   * the vast majority of the board went unplayed. Those stay plainly locked;
   * only a card that was actually picked earns a result treatment.
   */
  const record = pickHistory.find((r) => r.offeringId === offering.id && r.status !== 'pending');
  const result: 'won' | 'lost' | null =
    record?.status === 'won' ? 'won' : record?.status === 'lost' ? 'lost' : null;
  const resultColor = result === 'won' ? 'var(--color-status-success)' : 'var(--color-status-error)';

  /*
   * Which side is marked.
   *
   * On a resolved card that is the side you PICKED, taken from the history
   * record — otherwise "Correct" sits above two identical-looking buttons and
   * never says what you were correct about. On a live card it is the current
   * selection, as before.
   */
  const isSelected = result ? true : activeSelection?.offeringId === offering.id;
  const selectedSide = result ? record!.side : activeSelection?.side;
  const markColor = result ? resultColor : '#FFFFFF';

  /*
   * Finished, and the player never answered it.
   *
   * On any given day most of the board goes unplayed — Streak allows one
   * live pick at a time. Those cards grey out and simply show which option
   * won, so a past day reads as a record of what happened rather than as a
   * wall of dead buttons.
   */
  /*
   * Greyscale is the "you sat this one out" treatment.
   *
   * Tied to being locked and unplayed, NOT to whether we could settle the
   * outcome. It used to require `correctSide`, which meant a push — an MLB
   * total that landed exactly on the line — came back with no winner, skipped
   * the greyscale, and sat there in full team colour looking live on a day
   * that had already finished. A past card should read as past whether or not
   * it produced a winner.
   */
  const unplayed = isLocked && !result;

  /*
   * Exactly one mark per card, and it goes on the row it describes.
   *
   * Picked   -> the mark sits on YOUR row, green check or red cross.
   * Unpicked -> a grey check sits on whichever row won.
   *
   * There is deliberately no second mark in the header. A green check up
   * there plus a green check on the row is the same fact stated twice, and on
   * a lost pick the pairing actively misread — a red cross in the corner over
   * a green check below looked like the card disagreed with itself.
   */
  const markFor = (side: PickSide): RowMark | undefined => {
    if (result) return side === record!.side ? (result === 'won' ? 'correct' : 'incorrect') : undefined;
    if (unplayed && offering.correctSide === side) return 'winner';
    return undefined;
  };

  const handlePick = (side: PickSide) => {
    if (isFutureDay) {
      showFutureDayNotice(`Come back ${formatDayLabelET(offering.startTimeISO!)} to make this pick.`);
      return;
    }
    if (isDisabled) return;
    selectPick(offering, side);
  };

  return (
    <div
      className={`pick-card-container relative border rounded-xl p-4 transition-all duration-300 animate-fade-in-up ${
        isSelected && !result
          ? 'shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          : isDisabled && !isSelected && !result
          ? 'opacity-50'
          : ''
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: isSelected && !result ? 'var(--color-theme-text)' : 'var(--color-theme-border)',
        overflow: 'visible',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <SportIcon league={offering.league} />
        <span className="text-[12px] leading-[14px] tracking-[0.02em] font-medium uppercase font-title" style={{ color: 'var(--color-theme-text-tertiary)' }}>{offering.league}</span>
        {isLocked || isFutureDay ? (
          /*
            Lock reads as disabled, not as a live accent.
            Was #006FFF — an action blue, which on a card you can no longer
            act on pulled the eye to the one thing that does nothing. Muted
            grey says "closed" without competing with the result badge.

            Same icon for isLocked and isFutureDay, but NOT the same title.
            "Locked" is true of a game that already started — saying that
            about Friday's game from a Tuesday reads as if it already
            happened. The future-day case gets the date it opens instead.
          */
          <span
            className="ml-auto flex items-center"
            style={{ color: 'var(--color-theme-text-muted)' }}
            title={isFutureDay ? `Opens ${formatDayLabelET(offering.startTimeISO!)}` : 'Locked'}
          >
            <LockMark />
          </span>
        ) : (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>
            {offering.startTime}
          </span>
        )}
      </div>

      {/*
        The question itself.

        PickCard never rendered `offering.question` — it did not need to,
        because every card was a spread and the two team names on the buttons
        carried the whole question. That stops being true the moment a card
        says "Yes / No": without this line a milestone prop is two buttons and
        a kickoff time, and the player has no idea what they are answering.

        Shown only for the kinds whose buttons do not self-describe. On a
        moneyline card the team names are already the question, and repeating
        "Who wins? Falcons @ Packers" above them is noise.
      */}
      {(offering.kind === 'milestone' || offering.kind === 'total') && (
        <div className="flex items-center gap-2.5 mb-2.5">
          {/*
            Headshot sits with the question, not on the buttons. A player prop
            is about one person, so duplicating the same face onto both Yes
            and No would read as two different options.

            Circular crop anchored to the top: ESPN headshots are full
            shoulders-up portraits, and centring the crop cuts the face in
            half.
          */}
          {offering.heroImage && (
            <img
              src={offering.heroImage}
              alt=""
              className="w-10 h-10 rounded-full shrink-0 object-cover object-top"
              style={{ backgroundColor: 'var(--color-theme-surface-alt)' }}
            />
          )}
          <div className="min-w-0">
            <p
              className="text-[14px] leading-[19px] font-title font-bold min-w-0"
              style={{ color: 'var(--color-theme-text)' }}
            >
              {offering.question}
            </p>
            {/*
              Milestone questions name a player and a stat, never a game — so
              without this a slate with three "150+ passing yards?" cards
              across three different Sunday games is unreadable. Total's
              question already says "Falcons @ Packers — total points", so
              this only fires where it would actually add information.
            */}
            {offering.kind === 'milestone' && offering.gameLabel && (
              <p
                className="text-[11px] leading-[14px] font-body mt-0.5"
                style={{ color: 'var(--color-theme-text-muted)' }}
              >
                {offering.gameLabel}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <PickButton
          label={offering.optionA}
          shortLabel={offering.shortA}
          abbrLabel={offering.abbrA}
          pickPct={submitted ? offering.pickPctA : undefined}
          stat={displayStatA}
          image={offering.noSideArt ? undefined : offering.imageA}
          color={offering.colorA}
          isHeadshot={isHeadshot}
          isSelected={isSelected && selectedSide === 'A'}
          isDisabled={isDisabled}
          keepClickable={isFutureDay}
          ringColor={markColor}
          desaturate={unplayed}
          mark={markFor('A')}
          onClick={() => handlePick('A')}
        />
        <PickButton
          label={offering.optionB}
          shortLabel={offering.shortB}
          abbrLabel={offering.abbrB}
          pickPct={submitted ? offering.pickPctB : undefined}
          stat={displayStatB}
          image={offering.noSideArt ? undefined : offering.imageB}
          color={offering.colorB}
          isHeadshot={isHeadshot}
          isSelected={isSelected && selectedSide === 'B'}
          isDisabled={isDisabled}
          keepClickable={isFutureDay}
          ringColor={markColor}
          desaturate={unplayed}
          mark={markFor('B')}
          onClick={() => handlePick('B')}
        />
      </div>
    </div>
  );
}
