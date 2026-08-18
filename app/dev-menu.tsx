import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import { DAY_STREAK_MILESTONES } from '@/lib/milestones';
import {
  BACKDATE_DAYS,
  backdateAccount,
  clearClosedDays,
  clearMilestones,
  getLessonDayOverride,
  MAX_LESSON_DAY,
  setLessonDayOverride,
  simulateDayStreak,
} from '@/lib/dev';
import { eveningReminderWanted, REMINDER_HOUR, sendReminderNow } from '@/lib/reminders';
import { deviceTimeZone } from '@/lib/week';

/**
 * The hidden developer menu — ten taps on the version number in Settings.
 *
 * It exists because the states worth checking are the ones that take a hundred
 * days to reach honestly: a milestone screen, a lesson late in the arc, an
 * evening notification that only fires at eight. Everything here fabricates
 * one of those and nothing here is reachable from a release build — see
 * `DEV_MENU_ENABLED`.
 *
 * The notification button deliberately goes through the same enabled check the
 * real schedule does, so "off in Settings" means off here too. A test switch
 * that ignores the user's preference tests the wrong thing.
 */
export default function DevMenuScreen() {
  const timeZone = useMemo(() => deviceTimeZone(), []);
  const [busy, setBusy] = useState(false);
  const [lessonDay, setLessonDay] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean | null>(null);

  const loadState = useCallback(async () => {
    const [override, wanted] = await Promise.all([getLessonDayOverride(), eveningReminderWanted()]);

    setLessonDay(override === null ? '' : String(override));
    setReminderEnabled(wanted);
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function run(label: string, work: () => Promise<{ ok: boolean; message?: string }>) {
    if (busy) return;
    setBusy(true);
    const result = await work();
    setBusy(false);
    Alert.alert(label, result.ok ? 'Done.' : (result.message ?? 'That did not work.'));
  }

  async function handleLessonDay() {
    const trimmed = lessonDay.trim();

    if (trimmed === '') {
      await setLessonDayOverride(null);
      Alert.alert('Lesson day', 'Back to the real day.');
      return;
    }

    const day = Number(trimmed);
    if (!Number.isInteger(day) || day < 1 || day > MAX_LESSON_DAY) {
      Alert.alert('Lesson day', `Pick a whole number from 1 to ${MAX_LESSON_DAY}.`);
      return;
    }

    await setLessonDayOverride(day);
    Alert.alert('Lesson day', `Today will show day ${day}.`);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={BrandSpace.lg}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeLabel}>Done</Text>
        </Pressable>

        <View style={styles.headings}>
          <Text style={styles.title}>Developer menu</Text>
          <Text style={styles.subtitle}>
            Writes invented rows into this account. Development builds only — none of this exists in
            a release build.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STREAK</Text>
          <Card>
            <Text style={styles.cardTitle}>Simulate a streak</Text>
            <Text style={styles.cardBody}>
              Closes the last N days, today included. Reopen Today to see the milestone.
            </Text>
            <View style={styles.chipWrap}>
              {DAY_STREAK_MILESTONES.map((days) => (
                <Pressable
                  key={days}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() =>
                    void run(`${days}-day streak`, () => simulateDayStreak(days, timeZone))
                  }
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                  <Text style={styles.chipLabel}>{days} days</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Card flush>
            <DevRow
              label={`Backdate this account ${BACKDATE_DAYS} days`}
              caption="Streaks and forgotten days are counted no further back than the join date, so nothing here works on an account made today. Simulating a streak does this for you."
              busy={busy}
              onPress={() => void run('Account age', () => backdateAccount())}
            />
            <Divider />
            <DevRow
              label="Clear every closed day"
              caption="Streak back to zero. Do this after backdating to make yesterday a forgotten day."
              busy={busy}
              onPress={() => void run('Closed days', clearClosedDays)}
            />
            <Divider />
            <DevRow
              label="Forget celebrated milestones"
              caption="Lets the same milestone screen fire again."
              busy={busy}
              onPress={() => void run('Milestones', clearMilestones)}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LESSONS</Text>
          <Card>
            <Text style={styles.cardTitle}>Simulate a lesson day</Text>
            <Text style={styles.cardBody}>
              Overrides which day of the arc Today shows. Leave empty for the real one.
            </Text>
            <View style={styles.field}>
              <TextField
                label={`Day (1-${MAX_LESSON_DAY})`}
                value={lessonDay}
                onChangeText={setLessonDay}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={() => void handleLessonDay()}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleLessonDay()}
              style={({ pressed }) => [
                styles.chip,
                styles.applyChip,
                pressed && styles.chipPressed,
              ]}>
              <Text style={styles.chipLabel}>Apply</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATION</Text>
          <Card flush>
            <DevRow
              label={`Send tonight's ${REMINDER_HOUR}:00 nudge now`}
              caption={
                reminderEnabled === false
                  ? 'Evening check-in is off in Settings, so nothing will arrive.'
                  : 'Arrives in about ten seconds. Stay here and tap the banner, or lock the phone to check the lock screen.'
              }
              busy={busy}
              onPress={() =>
                void run('Evening nudge', async () => {
                  const state = await sendReminderNow();
                  if (state === 'scheduled') return { ok: true };
                  if (state === 'off') {
                    return { ok: false, message: 'Evening check-in is off in Settings.' };
                  }
                  return { ok: false, message: 'Notifications are not allowed for Mesura.' };
                })
              }
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function DevRow({
  label,
  caption,
  onPress,
  busy,
}: {
  label: string;
  caption?: string;
  onPress: () => void;
  busy: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        busy && styles.rowDisabled,
      ]}>
      <Text style={styles.rowLabel}>{label}</Text>
      {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    paddingHorizontal: BrandSpace.xl,
    paddingTop: BrandSpace.md,
    paddingBottom: BrandSpace.xxxl,
    gap: BrandSpace.xl,
  },
  close: {
    alignSelf: 'flex-start',
    paddingVertical: BrandSpace.xs,
  },
  closeLabel: {
    ...BrandType.label,
    color: BrandColor.spruce,
  },
  pressed: {
    opacity: 0.6,
  },
  headings: {
    gap: BrandSpace.sm,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  subtitle: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  section: {
    gap: BrandSpace.md,
  },
  sectionLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    letterSpacing: 0.6,
  },
  cardTitle: {
    ...BrandType.heading,
    color: BrandColor.ink,
  },
  cardBody: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    marginTop: BrandSpace.xs,
  },
  field: {
    marginTop: BrandSpace.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandSpace.sm,
    marginTop: BrandSpace.lg,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: BrandSpace.md,
    paddingHorizontal: BrandSpace.lg,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.pill,
  },
  applyChip: {
    marginTop: BrandSpace.lg,
  },
  chipPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  chipLabel: {
    ...BrandType.label,
    color: BrandColor.ink,
  },
  divider: {
    height: BrandBorderWidth,
    backgroundColor: BrandColor.line,
  },
  row: {
    paddingHorizontal: BrandSpace.xl,
    paddingVertical: BrandSpace.lg,
    gap: BrandSpace.xs,
    minHeight: 52,
    justifyContent: 'center',
  },
  rowPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLabel: {
    ...BrandType.body,
    color: BrandColor.spruce,
  },
  rowCaption: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
});
