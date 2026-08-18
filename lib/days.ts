/**
 * The day, as a unit: the plan made for an evening, the ritual that closes it,
 * and the streak that both feed.
 *
 * Weeks are what Mesura scores (see [`week.ts`](week.ts) and
 * [`drinks.ts`](drinks.ts)); days are what the user actually lives through, and
 * the only thing a nightly ritual can be about. Nothing here imports React.
 *
 * Everything is keyed on a `DateKey` — `YYYY-MM-DD` in the user's own zone —
 * rather than on an instant, because "yesterday" is a wall-clock idea.
 */

import type { DateKey, DayClose, EveningPlan } from '@/lib/database.types';
import type { WriteResult } from '@/lib/drinks';
import { supabase } from '@/lib/supabase';
import { daysBetweenKeys, shiftDateKey, type WeekRange } from '@/lib/week';

/**
 * How many days before today can still be corrected: yesterday, and no further.
 *
 * The PRD calls this a 48-hour window, and whole local days are how that
 * promise is actually kept — yesterday at midnight is never more than 48 hours
 * ago, and a boundary the user can see ("today and yesterday") beats a rolling
 * one that cuts an evening in half. Past that the edge of reliable recall has
 * gone, a "count" becomes a guess, and a streak built on guesses is not worth
 * defending. Older days are the streak repair's job instead, which is
 * deliberately rationed and says so.
 */
export const BACKFILL_DAYS_BACK = 1;

/** Grace, not a loophole: one forgotten day a week can be forgiven. */
export const REPAIRS_PER_WEEK = 1;

/**
 * How far back a rescue looks for the day that broke the streak.
 *
 * If the last fortnight is entirely unclosed then the streak is honestly zero,
 * and one repair would not change that — so there is nothing to offer.
 */
const RESCUE_SEARCH_DAYS = 14;

/** The one-tap counts the plan sheet offers. Above five, a plan stops being a plan. */
export const PLAN_CHOICES = [0, 1, 2, 3, 4, 5] as const;

/**
 * Consecutive closed days, counting back from today.
 *
 * Today not being closed yet is not a break — it is the normal state of every
 * day before about eight in the evening. So the count starts at today when
 * today is closed and at yesterday when it is not, which is what stops the
 * streak from appearing to die every single morning.
 */
export function dayStreakFrom(
  closedKeys: ReadonlySet<DateKey>,
  options: { todayKey: DateKey; joinedKey: DateKey }
): number {
  const { todayKey, joinedKey } = options;
  let cursor = closedKeys.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  let streak = 0;

  while (closedKeys.has(cursor) && daysBetweenKeys(joinedKey, cursor) >= 0) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

/**
 * The single day standing between the user and a longer streak, and what they
 * are allowed to do about it.
 *
 * `close` is the honest fix and is unlimited inside the backfill window: you
 * remember last night, so say what happened. `repair` covers everything older,
 * where nobody's memory is good enough — so it is rationed to one a week, and
 * the copy says so rather than pretending the day was reconstructed.
 */
export type StreakRescue =
  { kind: 'close'; dateKey: DateKey } | { kind: 'repair'; dateKey: DateKey; repairsLeft: number };

export function streakRescueFrom(
  closedKeys: ReadonlySet<DateKey>,
  options: {
    todayKey: DateKey;
    joinedKey: DateKey;
    /** Repairs already spent in the current week. */
    repairsUsed: number;
  }
): StreakRescue | null {
  const { todayKey, joinedKey, repairsUsed } = options;

  // The gap is the most recent unclosed day that is not today. Today is never a
  // gap: the day is not over.
  let gapKey: DateKey | null = null;

  for (let back = 1; back <= RESCUE_SEARCH_DAYS; back += 1) {
    const key = shiftDateKey(todayKey, -back);
    if (daysBetweenKeys(joinedKey, key) < 0) break;
    if (!closedKeys.has(key)) {
      gapKey = key;
      break;
    }
  }

  if (!gapKey) return null;

  if (daysBetweenKeys(gapKey, todayKey) <= BACKFILL_DAYS_BACK) {
    return { kind: 'close', dateKey: gapKey };
  }

  const repairsLeft = REPAIRS_PER_WEEK - repairsUsed;
  if (repairsLeft <= 0) return null;

  return { kind: 'repair', dateKey: gapKey, repairsLeft };
}

/** Repairs spent inside one week, which is the span the ration is counted over. */
export function repairsUsedIn(
  closes: Pick<DayClose, 'repaired' | 'closed_at'>[],
  week: WeekRange
): number {
  return closes.filter((close) => {
    if (!close.repaired) return false;
    const at = new Date(close.closed_at).getTime();
    return at >= week.start.getTime() && at < week.end.getTime();
  }).length;
}

/**
 * How an evening went against the plan made for it.
 *
 * A met plan gets a name — "Stuck to your plan" — because that is the win the
 * whole mechanic exists to create. A missed one gets the two numbers and
 * **nothing else**: the silence is the design. Any sentence added here would be
 * the app having an opinion about a grown adult's evening, which is the exact
 * register this product does not use.
 */
export type PlanVerdict = {
  headline: string;
  caption?: string;
  tone: 'spruce' | 'neutral';
};

export function planVerdict(intended: number, actual: number): PlanVerdict {
  if (actual > intended) {
    return { headline: `Planned ${intended} · logged ${actual}`, tone: 'neutral' };
  }

  return {
    headline: 'Stuck to your plan',
    caption:
      intended === 0 && actual === 0
        ? 'An alcohol-free evening, exactly as planned.'
        : `Planned ${intended}, logged ${actual}.`,
    tone: 'spruce',
  };
}

/** The line the plan card shows while the evening is still going. */
export function planProgress(intended: number, actual: number): string {
  const left = intended - actual;
  if (left > 0) return `${actual} of ${intended} so far — ${left} left`;
  if (left === 0) return `${actual} of ${intended} — at your plan`;
  return `${actual} logged, planned ${intended}`;
}

// ---------------------------------------------------------------------------
// Reads and writes
// ---------------------------------------------------------------------------

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Sets tonight's intended count, replacing any plan already made for the day.
 *
 * Upserted rather than inserted, so that changing your mind at seven is the
 * same one-tap gesture as deciding at six.
 */
export async function setEveningPlan(dateKey: DateKey, intended: number): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'You need to be signed in to plan an evening.' };

  const { error } = await supabase
    .from('evening_plans')
    .upsert(
      { user_id: userId, plan_date: dateKey, intended_drinks: intended },
      { onConflict: 'user_id,plan_date' }
    );

  if (error) return { ok: false, message: 'That did not save. Try again.' };
  return { ok: true };
}

export async function clearEveningPlan(dateKey: DateKey): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'You need to be signed in.' };

  const { error } = await supabase
    .from('evening_plans')
    .delete()
    .eq('user_id', userId)
    .eq('plan_date', dateKey);

  if (error) return { ok: false, message: 'That did not save. Try again.' };
  return { ok: true };
}

/**
 * Closes a day.
 *
 * `drinks` is stored alongside the logs rather than derived from them later, so
 * that an edit made next week cannot quietly rewrite the number the user
 * actually agreed to at the time.
 */
export async function closeDay(
  dateKey: DateKey,
  drinks: number,
  options: { repaired?: boolean } = {}
): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'You need to be signed in to close a day.' };

  const { error } = await supabase.from('day_closes').upsert(
    {
      user_id: userId,
      close_date: dateKey,
      drinks,
      repaired: options.repaired ?? false,
      closed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,close_date' }
  );

  if (error) return { ok: false, message: 'That did not save. Try again.' };
  return { ok: true };
}

/**
 * Spends this week's repair on one forgotten day.
 *
 * The ration is re-read from the server before spending rather than trusted
 * from the screen, so a second phone cannot double-spend it. Enforcing it in
 * Postgres would need the database to know which week the user is standing in,
 * which is a client fact.
 */
export async function repairStreak(dateKey: DateKey, week: WeekRange): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'You need to be signed in.' };

  const { data, error } = await supabase
    .from('day_closes')
    .select('repaired, closed_at')
    .eq('user_id', userId)
    .gte('closed_at', week.start.toISOString())
    .lt('closed_at', week.end.toISOString());

  if (error) return { ok: false, message: 'Could not check your repairs. Try again.' };
  if (repairsUsedIn(data ?? [], week) >= REPAIRS_PER_WEEK) {
    return { ok: false, message: 'This week’s repair is used. There is another on Sunday.' };
  }

  return closeDay(dateKey, 0, { repaired: true });
}

export type DayContext = {
  /** Tonight's plan, if one has been made. */
  plan: EveningPlan | null;
  /** Every day the user has closed, most recent first. */
  closes: Pick<DayClose, 'close_date' | 'drinks' | 'repaired' | 'closed_at'>[];
};

/**
 * How far back closed days are read.
 *
 * Longer than the longest milestone, so a hundred-day streak can still be
 * counted, and short enough to stay a handful of very small rows.
 */
const CLOSES_HISTORY_DAYS = 400;

/** Reads the plan and the closed days behind Today's day surfaces. */
export async function loadDayContext(
  userId: string,
  todayKey: DateKey
): Promise<DayContext | null> {
  const [planResult, closesResult] = await Promise.all([
    supabase
      .from('evening_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', todayKey)
      .maybeSingle(),
    supabase
      .from('day_closes')
      .select('close_date, drinks, repaired, closed_at')
      .eq('user_id', userId)
      .gte('close_date', shiftDateKey(todayKey, -CLOSES_HISTORY_DAYS))
      .order('close_date', { ascending: false }),
  ]);

  if (closesResult.error) return null;

  return {
    plan: planResult.data ?? null,
    closes: closesResult.data ?? [],
  };
}
