/**
 * The weekly number: reading it, adding to it, and turning it into English.
 *
 * Everything the Today screen shows is derived here, so the screen itself
 * stays layout. Nothing in this file imports React.
 */

import type { DrinkLog, DrinkType, Profile, UrgeOutcome } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { daysBetween, deviceTimeZone, weekRange, type WeekRange } from '@/lib/week';

/**
 * How far back the streak count and the "usual drinks" list look.
 *
 * A year, because the streak cannot count past the end of this window and a
 * streak that silently stops growing is the exact unfairness this product
 * promises not to have. An account cannot be older than this yet; when one
 * can, the count belongs in a Postgres aggregate rather than in a year of rows
 * pulled down on every focus.
 */
const HISTORY_WEEKS = 52;

/**
 * Offered when the user has no history to learn from yet, so a brand-new
 * account still gets a sensible sheet.
 */
const DEFAULT_TYPES: DrinkType[] = ['beer', 'wine', 'cocktail', 'spirits'];

/** How many one-tap options the log sheet shows above "Something else". */
export const QUICK_TYPE_COUNT = 3;

export const DRINK_TYPE_LABEL: Record<DrinkType, string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirits: 'Spirits',
  cocktail: 'Cocktail',
  other: 'Other',
};

/** Everything Today draws, computed once. */
export type WeekSnapshot = {
  profile: Profile;
  week: WeekRange;
  timeZone: string;
  /** Drinks logged this week, summed over `quantity`. */
  drinks: number;
  /** Days remaining in the week, counting today. */
  daysLeft: number;
  /** Consecutive finished weeks at or under the number. */
  streakWeeks: number;
  /** Lifetime urges ridden out. */
  urgesSurvived: number;
  /** `(baseline - actual) * cost`, floored at zero. */
  moneySaved: number;
  /** The user's most-logged types, most frequent first. */
  quickTypes: DrinkType[];
  /** Whole days since the account was created, for the lesson day. */
  daysSinceJoining: number;
};

export type LoadResult<T> = { ok: true; value: T } | { ok: false; message: string };

/**
 * Money saved is a promise the app makes, so it is deliberately conservative:
 * a week spent above the old normal saves nothing, it does not owe.
 */
export function moneySaved(baselineDrinks: number, drinks: number, drinkCost: number): number {
  return Math.max(0, baselineDrinks - drinks) * drinkCost;
}

/**
 * Whole currency units unless the cents carry the news. "$16" reads as a
 * number you can feel; "$16.00" reads as a receipt.
 */
export function formatMoney(amount: number): string {
  const whole = Number.isInteger(amount);
  const digits = whole ? 0 : 2;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(digits)}`;
  }
}

function daysToGo(daysLeft: number): string {
  return daysLeft <= 1 ? 'today is the last day' : `${daysLeft} days to go`;
}

/**
 * The status line under the ring. `tone` picks the colour, never the words —
 * being over is a fact about the week, not a verdict on the person.
 */
export function weekStatus(
  drinks: number,
  target: number,
  daysLeft: number
): { text: string; tone: 'spruce' | 'over' } {
  const remaining = target - drinks;

  if (target === 0) {
    return drinks === 0
      ? { text: `Alcohol-free week — ${daysToGo(daysLeft)}`, tone: 'spruce' }
      : { text: `${drinks} logged — a fresh week starts Sunday`, tone: 'over' };
  }

  if (remaining < 0) {
    return { text: `${-remaining} over — a fresh week starts Sunday`, tone: 'over' };
  }

  if (remaining === 0) {
    return {
      text:
        daysLeft <= 1
          ? 'At your number, with the week nearly won'
          : `At your number — ${daysToGo(daysLeft)}`,
      tone: 'spruce',
    };
  }

  return { text: `On track — ${remaining} left, ${daysToGo(daysLeft)}`, tone: 'spruce' };
}

function sumQuantity(logs: Pick<DrinkLog, 'quantity'>[]): number {
  return logs.reduce((total, log) => total + Number(log.quantity), 0);
}

/**
 * How many recent drinks decide the three quick options. Short on purpose:
 * someone who switched from wine to beer in March should not be tapping past
 * last year's habit in April.
 */
const RECENT_LOGS_FOR_QUICK_TYPES = 60;

/**
 * The three types to put on the sheet: whatever this user actually drinks,
 * topped up from the defaults so there are always three buttons.
 *
 * Expects `logs` newest-first, which is how `loadWeekSnapshot` orders them.
 *
 * `other` never appears here. It is the escape hatch below the quick options,
 * so promoting it would leave the sheet offering "Other" twice.
 */
export function quickTypesFrom(logs: Pick<DrinkLog, 'drink_type'>[]): DrinkType[] {
  const counts = new Map<DrinkType, number>();

  for (const log of logs.slice(0, RECENT_LOGS_FOR_QUICK_TYPES)) {
    if (log.drink_type === 'other') continue;
    counts.set(log.drink_type, (counts.get(log.drink_type) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([type]) => type);

  for (const fallback of DEFAULT_TYPES) {
    if (ranked.length >= QUICK_TYPE_COUNT) break;
    if (!ranked.includes(fallback)) ranked.push(fallback);
  }

  return ranked.slice(0, QUICK_TYPE_COUNT);
}

/**
 * Finished weeks, counting back from last week, that came in at or under the
 * number.
 *
 * Two honest limitations, both fine for a v1: past weeks are scored against
 * the *current* target, because no history of the target is kept yet; and a
 * week that started before the account did is never counted, so a new account
 * cannot inherit a streak from empty history.
 */
export function streakFrom(
  logs: Pick<DrinkLog, 'logged_at' | 'quantity'>[],
  options: { now: Date; timeZone: string; target: number; joinedAt: Date }
): number {
  const { now, timeZone, target, joinedAt } = options;
  let streak = 0;

  for (let weeksAgo = 1; weeksAgo <= HISTORY_WEEKS; weeksAgo += 1) {
    const week = weekRange(now, timeZone, weeksAgo);
    if (week.start.getTime() < joinedAt.getTime()) break;

    const drinks = sumQuantity(
      logs.filter((log) => {
        const at = new Date(log.logged_at).getTime();
        return at >= week.start.getTime() && at < week.end.getTime();
      })
    );

    if (drinks > target) break;
    streak += 1;
  }

  return streak;
}

/**
 * Reads everything Today needs, in two round trips.
 *
 * The profile's stored zone is refreshed from the device when the two
 * disagree: weeks are defined in the user's zone, and the device is the only
 * thing that knows it. That write is deliberately not awaited — a failure
 * there must not stop the screen from drawing.
 */
export async function loadWeekSnapshot(): Promise<LoadResult<WeekSnapshot>> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, message: 'You need to be signed in to see your week.' };
  }

  const userId = userData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, message: 'Could not load your profile. Pull down to try again.' };
  }

  const now = new Date();
  const timeZone = deviceTimeZone();
  if (profile.timezone !== timeZone) {
    void supabase.from('profiles').update({ timezone: timeZone }).eq('id', userId);
  }

  const week = weekRange(now, timeZone);
  const historyStart = weekRange(now, timeZone, HISTORY_WEEKS).start;

  const [logsResult, urgesResult] = await Promise.all([
    supabase
      .from('drink_logs')
      .select('id, logged_at, drink_type, quantity')
      .gte('logged_at', historyStart.toISOString())
      .lt('logged_at', week.end.toISOString())
      .order('logged_at', { ascending: false }),
    supabase
      .from('urge_logs')
      .select('id', { count: 'exact', head: true })
      .eq('outcome', 'survived'),
  ]);

  if (logsResult.error) {
    return { ok: false, message: 'Could not load this week. Pull down to try again.' };
  }

  const logs = logsResult.data ?? [];
  const thisWeek = logs.filter((log) => new Date(log.logged_at).getTime() >= week.start.getTime());
  const drinks = sumQuantity(thisWeek);
  const joinedAt = new Date(profile.created_at);

  return {
    ok: true,
    value: {
      profile,
      week,
      timeZone,
      drinks,
      daysLeft: week.daysLeft,
      streakWeeks: streakFrom(logs, { now, timeZone, target: profile.weekly_target, joinedAt }),
      urgesSurvived: urgesResult.count ?? 0,
      moneySaved: moneySaved(profile.baseline_drinks, drinks, Number(profile.drink_cost)),
      quickTypes: quickTypesFrom(logs),
      daysSinceJoining: daysBetween(joinedAt, now, timeZone),
    },
  };
}

export type WriteResult = { ok: true } | { ok: false; message: string };

/**
 * Adds one drink, timestamped now.
 *
 * `logged_at` is sent by the client rather than left to the column default so
 * the row lands in the week the user is actually looking at, rather than in
 * whichever week the server's clock is in a second either side of midnight.
 */
export async function logDrink(drinkType: DrinkType, quantity = 1): Promise<WriteResult> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: 'You need to be signed in to log a drink.' };

  const { error } = await supabase.from('drink_logs').insert({
    user_id: userData.user.id,
    logged_at: new Date().toISOString(),
    drink_type: drinkType,
    quantity,
  });

  if (error) return { ok: false, message: 'That did not save. Try again.' };
  return { ok: true };
}

/** The column caps the note at 500 characters; trim rather than let it fail. */
const MAX_TRIGGER_NOTE = 500;

/**
 * Records an urge, whichever way it went. Riding one out is a logged win.
 *
 * The note is optional in every sense: blank is stored as null, and a write
 * that would fail on length is trimmed rather than rejected. Nobody should
 * lose a logged win to a validation error in the middle of an urge.
 */
export async function logUrge(outcome: UrgeOutcome, triggerNote?: string): Promise<WriteResult> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: 'You need to be signed in to log an urge.' };

  const note = triggerNote?.trim().slice(0, MAX_TRIGGER_NOTE);

  const { error } = await supabase.from('urge_logs').insert({
    user_id: userData.user.id,
    logged_at: new Date().toISOString(),
    outcome,
    trigger_note: note ? note : null,
  });

  if (error) return { ok: false, message: 'That did not save. Try again.' };
  return { ok: true };
}
