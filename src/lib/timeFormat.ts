/**
 * Lock-time formatting.
 *
 * Every card says "ET", so every card had better be showing Eastern time.
 * The previous implementations — one in draftKingsApi, one in espnCoreOdds,
 * one in the offline snapshot — all used `date.getHours()`, which is the
 * VIEWER'S local timezone, and then appended the literal string "ET".
 *
 * So a game at 00:15Z (8:15 PM ET) displayed as "Lock @ 5:15 PM ET" on a
 * Pacific machine and "Lock @ 1:15 AM ET" in London. The label was a
 * constant; only the number moved. Nobody notices until two people compare
 * screens, or until a build runs in a different timezone than the reviewer.
 *
 * Formatting explicitly in America/New_York makes the label true and makes
 * the board identical for everyone, which matters for a prototype that gets
 * opened from wherever.
 */

const ET = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** "Lock @ 8:15 PM ET" */
export function formatLockET(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  // en-US gives "8:15 PM"; the narrow no-break space some ICU builds emit
  // between time and meridiem is normalised so string comparisons in tests
  // and snapshots stay stable.
  return `Lock @ ${ET.format(d).replace(/ /g, ' ')} ET`;
}

/** Day bucket in Eastern time — the board is organised by ET game day. */
const ET_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "2026-09-27" for the ET calendar day a kickoff falls on. */
export function etDayKey(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return ET_DAY.format(d);
}

const ET_DAY_LABEL = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** "Thu, Sep 25" — for telling a player which day a future pick opens on. */
export function formatDayLabelET(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return ET_DAY_LABEL.format(d);
}

const ET_HOUR_24 = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  hour12: false,
});

/**
 * The instant that is a given wall-clock hour, ET, on a given ET calendar day.
 *
 * Used to build "noon ET" / "11am ET" cutoffs for the pick-window scheduler.
 * A fixed UTC offset would drift by an hour across the DST boundary the NFL
 * season crosses in early November, so this corrects against what
 * `America/New_York` actually reports for the guessed instant instead of
 * assuming EDT or EST. Two passes is enough for an hour-level target — DST
 * itself only ever flips at 2am, nowhere near noon.
 */
export function etDateAt(dayKey: string, hour: number): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  let guess = new Date(Date.UTC(y, m - 1, d, hour + 4, 0, 0)); // EDT guess
  for (let i = 0; i < 2; i++) {
    const reported = Number(ET_HOUR_24.format(guess)) % 24;
    const diff = hour - reported;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff * 3_600_000);
  }
  return guess;
}
