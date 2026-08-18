/**
 * The hidden developer menu's machinery.
 *
 * Everything here fabricates state that would otherwise take a hundred real
 * days to reach. That is useful and it is also dangerous, so the whole surface
 * is gated on `DEV_MENU_ENABLED` and vanishes from a release build: a menu that
 * writes invented rows into a paying user's account is a bug report waiting to
 * be filed, however well hidden the gesture is.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WriteResult } from '@/lib/drinks';
import { supabase } from '@/lib/supabase';
import { localDateKey, shiftDateKey } from '@/lib/week';

/**
 * `__DEV__` is false in any production bundle, which is the point. Expo Go is
 * always a development bundle, so the menu is there whenever it is needed and
 * gone whenever it is not.
 */
export const DEV_MENU_ENABLED = __DEV__;

/** How many taps on the version number open it. */
export const DEV_MENU_TAPS = 10;

/** The lesson arc is sixty days (PRD §10), so that is the range worth simulating. */
export const MAX_LESSON_DAY = 60;

const LESSON_DAY_KEY = 'mesura.dev.lessonDay';

/**
 * A pretended lesson day, or null for the real one.
 *
 * Kept on the device rather than in the profile: it is a lie told to one
 * screen on one phone, and it must not survive into anybody's data.
 */
export async function getLessonDayOverride(): Promise<number | null> {
  if (!DEV_MENU_ENABLED) return null;

  try {
    const stored = await AsyncStorage.getItem(LESSON_DAY_KEY);
    if (!stored) return null;
    const day = Number(stored);
    return Number.isFinite(day) && day >= 1 && day <= MAX_LESSON_DAY ? day : null;
  } catch {
    return null;
  }
}

export async function setLessonDayOverride(day: number | null): Promise<void> {
  try {
    if (day === null) await AsyncStorage.removeItem(LESSON_DAY_KEY);
    else await AsyncStorage.setItem(LESSON_DAY_KEY, String(day));
  } catch {
    // A dev convenience that fails to persist is not worth an error path.
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * How far back a backdate reaches by default: past the longest milestone, with
 * room for the forgotten days a repair is meant to cover.
 */
export const BACKDATE_DAYS = 120;

/**
 * Makes the account at least `days` old.
 *
 * Nothing about days or streaks can be tested without this. Both
 * `dayStreakFrom` and `streakRescueFrom` stop counting at the join date — so
 * that a new account cannot inherit a streak or be nagged about days before it
 * existed — which means on an account created this morning a simulated streak
 * silently reads 1 and the forgotten-day card can never appear at all.
 *
 * Only ever moves `created_at` earlier. An account that is already old enough
 * is left alone rather than made younger.
 *
 * The side effect is the lesson day, which is also counted from here — use the
 * lesson-day override below to pin that back where you want it.
 */
export async function backdateAccount(days = BACKDATE_DAYS): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'Sign in first.' };

  const { data, error: readError } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (readError || !data) return { ok: false, message: 'Could not read your profile.' };

  const target = new Date(Date.now() - days * 86_400_000);
  if (new Date(data.created_at).getTime() <= target.getTime()) return { ok: true };

  const { error } = await supabase
    .from('profiles')
    .update({ created_at: target.toISOString() })
    .eq('id', userId);

  if (error) return { ok: false, message: 'Could not backdate the account.' };
  return { ok: true };
}

/**
 * Closes the last `days` days, today included, so the streak reads exactly
 * that number the next time Today loads.
 *
 * Ages the account first, because the streak is counted no further back than
 * the join date — without this the rows land and the streak still reads 1, and
 * a dev tool that quietly does nothing is worse than no dev tool.
 *
 * Fills only the days that are not closed already, rather than upserting the
 * whole run. Overwriting was quietly destructive: a day closed by a streak
 * repair came back as `repaired: false`, which erased the evidence that the
 * week's one repair had been spent and handed out a second one. A dev tool that
 * fakes a streak must not also falsify the ration the streak is tested against.
 *
 * New rows are `repaired: false` — a simulated streak is meant to look like one
 * the user earned, and the ration counts repairs, not closes.
 */
export async function simulateDayStreak(days: number, timeZone: string): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'Sign in first.' };

  const aged = await backdateAccount(Math.max(days, BACKDATE_DAYS));
  if (!aged.ok) return aged;

  const todayKey = localDateKey(new Date(), timeZone);
  const wanted = Array.from({ length: days }, (_, index) => shiftDateKey(todayKey, -index));

  const { data: existing, error: readError } = await supabase
    .from('day_closes')
    .select('close_date')
    .eq('user_id', userId)
    .gte('close_date', wanted[wanted.length - 1])
    .lte('close_date', wanted[0]);

  if (readError) return { ok: false, message: 'Could not read the closed days.' };

  const alreadyClosed = new Set((existing ?? []).map((close) => close.close_date));
  const missing = wanted.filter((key) => !alreadyClosed.has(key));
  if (missing.length === 0) return { ok: true };

  const closedAt = new Date().toISOString();
  const { error } = await supabase.from('day_closes').insert(
    missing.map((close_date) => ({
      user_id: userId,
      close_date,
      drinks: 0,
      repaired: false,
      closed_at: closedAt,
    }))
  );

  if (error) return { ok: false, message: 'Could not write the closed days.' };
  return { ok: true };
}

/** Wipes every closed day, which resets the streak to zero. */
export async function clearClosedDays(): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'Sign in first.' };

  const { error } = await supabase.from('day_closes').delete().eq('user_id', userId);
  if (error) return { ok: false, message: 'Could not clear the closed days.' };
  return { ok: true };
}

/**
 * Forgets which milestones have been celebrated.
 *
 * Without this, a milestone can only ever be seen once per account — which is
 * correct for a user and useless for whoever is checking that the screen looks
 * right.
 */
export async function clearMilestones(): Promise<WriteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, message: 'Sign in first.' };

  const { error } = await supabase.from('milestones').delete().eq('user_id', userId);
  if (error) return { ok: false, message: 'Could not clear the milestones.' };
  return { ok: true };
}
