/**
 * The evening nudge — the app's only proactive daily touch (PRD §5).
 *
 * A **local** notification, scheduled on the device by `expo-notifications`.
 * Nothing is sent from a server and no push token is ever registered, which is
 * both what keeps this working inside Expo Go and what keeps the promise on the
 * paywall: push only, no SMS, nothing that needs our servers to know the time
 * where you live.
 *
 * The preference lives on `profiles.evening_reminder` so it survives a
 * reinstall; the schedule itself is per device, so it is reconciled against the
 * profile every time Today loads.
 */

import * as Notifications from 'expo-notifications';

import type { WriteResult } from '@/lib/drinks';
import { supabase } from '@/lib/supabase';

/** Around eight: late enough that the evening has happened, early enough to act on. */
export const REMINDER_HOUR = 20;

/** Marks the notifications this module owns, so nothing else gets cancelled. */
const REMINDER_KIND = 'evening-check-in';

/**
 * How long the dev menu's "send it now" waits.
 *
 * Long enough to dismiss the confirmation and lock the phone without rushing,
 * for anyone checking the lock-screen path. Staying in the app works too — the
 * handler above shows the banner in the foreground as well, and tapping that
 * banner is the same tap.
 */
const TEST_DELAY_SECONDS = 10;

export type ReminderState = 'scheduled' | 'off' | 'denied';

/**
 * Notifications that arrive while the app is open still show as a banner.
 *
 * The nudge is a nudge whether or not you happen to be looking at the phone,
 * and the one thing it must never do is make a noise: this is the app that
 * does not badger people.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * iOS grants permission in more than one shape — a provisional grant delivers
 * quietly without ever asking, and reads as "not granted" at the top level.
 */
function isGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function scheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter((request) => request.content.data?.kind === REMINDER_KIND);
}

async function cancelAll(requests: Notifications.NotificationRequest[]): Promise<void> {
  await Promise.all(
    requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

const REMINDER_CONTENT: Notifications.NotificationContentInput = {
  title: 'How did today go?',
  body: 'One tap to close the day.',
  data: { kind: REMINDER_KIND, hour: REMINDER_HOUR },
  sound: false,
};

/**
 * Brings the device's schedule in line with the user's preference.
 *
 * Safe to call on every load: an already-correct schedule is left alone, so the
 * repeating notification is not torn down and rebuilt several times a day. The
 * stored `hour` is what makes that check possible without inspecting a trigger,
 * whose shape differs by platform.
 *
 * `ask` decides whether the operating system's permission prompt may appear.
 * Today passes it; a screen that is merely reading the state does not.
 */
export async function syncEveningReminder(
  enabled: boolean,
  options: { ask?: boolean } = {}
): Promise<ReminderState> {
  const existing = await scheduledReminders();

  if (!enabled) {
    await cancelAll(existing);
    return 'off';
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (!isGranted(permissions) && permissions.canAskAgain && options.ask) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: false, allowBadge: false },
    });
  }

  if (!isGranted(permissions)) {
    await cancelAll(existing);
    return 'denied';
  }

  const correct = existing.filter((request) => request.content.data?.hour === REMINDER_HOUR);
  if (correct.length === 1 && existing.length === 1) return 'scheduled';

  await cancelAll(existing);
  await Notifications.scheduleNotificationAsync({
    content: REMINDER_CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: 0,
    },
  });

  return 'scheduled';
}

/**
 * Fires tonight's nudge in a few seconds instead of at eight.
 *
 * For the developer menu only. It goes through the same permission check and
 * carries the same payload as the real one, so "it works in the dev menu" and
 * "it works at eight" mean the same thing.
 *
 * The preference is read here, at the moment of the press, rather than passed
 * in by the screen. A screen reads it once when it opens, which is exactly the
 * wrong time: the reason to open the developer menu at all is to test a switch
 * that was just flipped somewhere else. Reading it late also means a failed
 * read means "off" — a test button that fires when it cannot confirm the user
 * wants it is worse than one that stays quiet.
 */
export async function sendReminderNow(): Promise<ReminderState> {
  if (!(await eveningReminderWanted())) return 'off';

  let permissions = await Notifications.getPermissionsAsync();
  if (!isGranted(permissions) && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: false, allowBadge: false },
    });
  }

  if (!isGranted(permissions)) return 'denied';

  await Notifications.scheduleNotificationAsync({
    content: REMINDER_CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_DELAY_SECONDS,
      repeats: false,
    },
  });

  return 'scheduled';
}

/** True when a notification response came from the evening nudge. */
export function isReminderResponse(response: Notifications.NotificationResponse | null): boolean {
  return response?.notification.request.content.data?.kind === REMINDER_KIND;
}

/**
 * Whether the nightly nudge is wanted, straight from the profile.
 *
 * Fails closed: an unreadable profile is not a licence to send notifications.
 */
export async function eveningReminderWanted(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('evening_reminder')
    .eq('id', userData.user.id)
    .single();

  if (error || !data) return false;
  return data.evening_reminder;
}

/**
 * Changes the preference and the schedule together.
 *
 * They are one thing wearing two hats — a stored `true` with nothing scheduled
 * is a promise the app quietly failed to keep — so nothing writes one without
 * the other. The returned state is what actually happened, which is how
 * Settings can say "notifications are off for Mesura" rather than pretending
 * the switch worked.
 */
export async function setEveningReminder(
  enabled: boolean
): Promise<WriteResult & { state?: ReminderState }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: 'You need to be signed in.' };

  const { error } = await supabase
    .from('profiles')
    .update({ evening_reminder: enabled })
    .eq('id', userData.user.id);

  if (error) return { ok: false, message: 'That did not save. Try again.' };

  const state = await syncEveningReminder(enabled, { ask: true });
  return { ok: true, state };
}
