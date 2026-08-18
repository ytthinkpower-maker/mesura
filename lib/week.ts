/**
 * Week boundaries, in the user's timezone.
 *
 * Mesura's weeks run Sunday 00:00 to Saturday 23:59:59 in whatever zone the
 * user lives in, because that is the week people mean when they say "this
 * week". Everything here converts between two things:
 *
 *   * an **instant** — a `Date`, an absolute point on the timeline, which is
 *     what `logged_at` stores and what queries compare against;
 *   * a **wall clock** — the year/month/day/hour someone would read off a
 *     clock in a particular zone.
 *
 * The conversion goes through `Intl.DateTimeFormat`, which is the only
 * timezone database available to us. Hermes ships one on iOS.
 */

/** Wall-clock fields for one instant, as read in one zone. */
type ZonedParts = {
  year: number;
  month: number;
  /** 1-31. */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday, matching `Date.prototype.getDay`. */
  weekday: number;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MS_PER_DAY = 86_400_000;

/** How many days a week is. Named so the arithmetic below reads as English. */
export const DAYS_IN_WEEK = 7;

/**
 * The device's IANA zone (`Europe/Amsterdam`, `America/New_York`).
 *
 * Falls back to `UTC` rather than throwing: a wrong-but-consistent week is a
 * cosmetic bug, while a crash on the home screen is not.
 */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });

  formatterCache.set(timeZone, formatter);
  return formatter;
}

/** Reads one instant as a wall clock in `timeZone`. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0';

  return {
    year: Number(find('year')),
    month: Number(find('month')),
    day: Number(find('day')),
    // 'h23' still renders midnight as '24' in some ICU versions.
    hour: Number(find('hour')) % 24,
    minute: Number(find('minute')),
    second: Number(find('second')),
    weekday: Math.max(0, WEEKDAYS.indexOf(find('weekday'))),
  };
}

/** The zone's offset from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  // The formatter has no milliseconds, so drop them from both sides.
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant at which a given local midnight happens.
 *
 * The offset depends on the instant we are looking for, which is the thing
 * being solved for — so guess with UTC, then correct. Two passes settle it,
 * including across a DST change: the first pass lands within a day of the
 * answer, and an offset is constant over any given day.
 */
function instantOfLocalMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0);
  let instant = wallClock;

  for (let pass = 0; pass < 2; pass += 1) {
    instant = wallClock - zoneOffsetMs(new Date(instant), timeZone);
  }

  return new Date(instant);
}

/** One Sunday-to-Saturday week as a half-open instant range. */
export type WeekRange = {
  /** Sunday 00:00 local, inclusive. */
  start: Date;
  /** The next Sunday 00:00 local, exclusive. */
  end: Date;
  /** Days remaining in the week, counting today. Sunday is 7, Saturday is 1. */
  daysLeft: number;
};

/**
 * The Sunday-to-Saturday week containing `instant`.
 *
 * `weeksAgo` steps backwards a whole week at a time, which History and the
 * streak count both need.
 */
export function weekRange(instant: Date, timeZone: string, weeksAgo = 0): WeekRange {
  const now = zonedParts(instant, timeZone);

  // Midday, not midnight: adding days to a date that sits an hour from a DST
  // change can otherwise land on the wrong calendar day.
  const sundayNoon =
    Date.UTC(now.year, now.month - 1, now.day, 12) -
    (now.weekday + weeksAgo * DAYS_IN_WEEK) * MS_PER_DAY;

  const sunday = new Date(sundayNoon);
  const start = instantOfLocalMidnight(
    sunday.getUTCFullYear(),
    sunday.getUTCMonth() + 1,
    sunday.getUTCDate(),
    timeZone
  );

  const nextSunday = new Date(sundayNoon + DAYS_IN_WEEK * MS_PER_DAY);
  const end = instantOfLocalMidnight(
    nextSunday.getUTCFullYear(),
    nextSunday.getUTCMonth() + 1,
    nextSunday.getUTCDate(),
    timeZone
  );

  return { start, end, daysLeft: DAYS_IN_WEEK - now.weekday };
}

/** Whole days from one instant to another, counted in local calendar days. */
export function daysBetween(from: Date, to: Date, timeZone: string): number {
  const a = zonedParts(from, timeZone);
  const b = zonedParts(to, timeZone);
  const aDay = Date.UTC(a.year, a.month - 1, a.day);
  const bDay = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bDay - aDay) / MS_PER_DAY);
}

/** "Tuesday, 18 August" — the date line at the top of Today. */
export function formatLongDate(instant: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(instant);
  } catch {
    return instant.toDateString();
  }
}

/**
 * A calendar day in one zone, as `YYYY-MM-DD`.
 *
 * This is the key `evening_plans.plan_date` and `day_closes.close_date` are
 * written against. A day is a thing people have opinions about — "last night",
 * "yesterday" — and those opinions are about a wall clock, not an instant.
 */
export function localDateKey(instant: Date, timeZone: string): string {
  const parts = zonedParts(instant, timeZone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * Moves a date key by whole calendar days.
 *
 * Pure arithmetic on the key, done in UTC so no zone is involved: adding a day
 * to "the 30th" must give "the 31st" whatever the clocks did that night.
 */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * MS_PER_DAY);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Whole calendar days from one date key to another. Negative if `to` is earlier. */
export function daysBetweenKeys(from: string, to: string): number {
  const parse = (key: string) => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(to) - parse(from)) / MS_PER_DAY);
}

/**
 * The instant of a wall-clock time on a given local day.
 *
 * Backfilling needs this: "yesterday, at the time it is now" has to land in
 * yesterday's local day and yesterday's week, whatever the offset did between
 * then and now.
 */
export function instantForLocalTime(
  dateKey: string,
  timeZone: string,
  hour: number,
  minute = 0
): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const midnight = instantOfLocalMidnight(year, month, day, timeZone);
  // Re-solved rather than added to midnight, so a day that gains or loses an
  // hour still puts 20:00 at 20:00.
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = midnight.getTime();

  for (let pass = 0; pass < 2; pass += 1) {
    instant = wallClock - zoneOffsetMs(new Date(instant), timeZone);
  }

  return new Date(instant);
}

/**
 * "Today", "Yesterday", or the weekday name — what a person calls a day when
 * it is recent enough to still be talking about.
 *
 * Takes no zone: a `DateKey` is already local, so the only safe way to read a
 * weekday off it is to treat it as a UTC date and never convert.
 */
export function formatDayKey(dateKey: string, todayKey: string): string {
  const delta = daysBetweenKeys(dateKey, todayKey);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Yesterday';

  const [year, month, day] = dateKey.split('-').map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day, 12));

  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'long' }).format(noon);
  } catch {
    return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  }
}

/** "9:40 pm" — the time on an entry row, in the user's own zone. */
export function formatTime(instant: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(instant);
  } catch {
    return instant.toISOString().slice(11, 16);
  }
}
