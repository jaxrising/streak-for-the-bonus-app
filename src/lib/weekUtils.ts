const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getCurrentWeekInfo() {
  const now = new Date();
  const weekNumber = getISOWeek(now);
  const { start, end } = getWeekBounds(now);
  const label = `Week ${weekNumber} · ${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}`;
  return { weekNumber, startDate: start, endDate: end, label };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getWeekDays(weekOffset: number = 0): { date: Date; dayName: string; dateLabel: string }[] {
  const now = new Date();
  const { start } = getWeekBounds(now);
  start.setDate(start.getDate() + weekOffset * 7);
  const days: { date: Date; dayName: string; dateLabel: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      dayName: DAY_NAMES[d.getDay()],
      dateLabel: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ---------------------------------------------------------------------------
 * Period week — the day nav on Home.
 *
 * Runs TUESDAY through MONDAY, because the brief is "7 periods ending on
 * Monday" and the worked example was "Week of 9/22 - 9/28" (Tue -> Mon).
 *
 * NOTE, and worth settling: this is NOT the same week as `getWeekBounds`
 * above, which is Monday->Sunday and drives the reward countdown on the
 * Rewards page. So as written, the board's week and the reward week are
 * offset by a day. Moving the reward boundary changes when bonus bets pay
 * out, which is a product call rather than a layout one — so the two are
 * deliberately separate until someone decides. Point `getWeekBounds` at
 * `getPeriodWeekBounds` to unify them.
 * ------------------------------------------------------------------------ */

/*
 * The board runs on Eastern time, not the viewer's.
 *
 * "Sunday's games" means Sunday in ET for a US sports product. Keying the nav
 * off the viewer's local calendar meant a west-coast viewer at 9pm Monday was
 * still on Monday while a 1am ET Tuesday kickoff had already rolled over — the
 * nav and the cards disagreed about what day it was.
 *
 * Anchoring at ET noon rather than ET midnight keeps the arithmetic clear of
 * DST transitions, which always land in the small hours.
 */
function etToday(ref: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(ref);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return new Date(get('year'), get('month') - 1, get('day'), 12, 0, 0, 0);
}

export function getPeriodWeekBounds(ref: Date = new Date()): { start: Date; end: Date } {
  const start = etToday(ref);
  // Walk back to the most recent Tuesday, staying put if today is Tuesday.
  start.setDate(start.getDate() - ((start.getDay() - 2 + 7) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface PeriodDay {
  date: Date;
  /** 'TUE' */
  abbr: string;
  /** 22 */
  dayOfMonth: number;
  /** '2026-09-22', used as a stable key and for grouping offerings */
  key: string;
  isToday: boolean;
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getPeriodDays(ref: Date = new Date()): PeriodDay[] {
  const { start } = getPeriodWeekBounds(ref);
  const today = etToday(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: d,
      abbr: DAY_ABBR[d.getDay()],
      dayOfMonth: d.getDate(),
      key: dayKey(d),
      isToday: isSameDay(d, today),
    };
  });
}

/** "Week of 9/22 - 9/28" */
export function getPeriodWeekLabel(ref: Date = new Date()): string {
  const { start, end } = getPeriodWeekBounds(ref);
  return `Week of ${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

export function getWeekEndCountdown() {
  const now = new Date();
  const { end } = getWeekBounds(now);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: false };
}

export function formatCountdown(c: ReturnType<typeof getWeekEndCountdown>): string {
  if (c.expired) return 'Expired';
  if (c.days > 0) return `${c.days}d ${c.hours}h ${c.minutes}m`;
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m ${c.seconds}s`;
  return `${c.minutes}m ${c.seconds}s`;
}
