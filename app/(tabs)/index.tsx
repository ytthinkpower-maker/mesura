import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { CloseDaySheet } from '@/components/close-day-sheet';
import { LogDrinkSheet } from '@/components/log-drink-sheet';
import { PlanTonightSheet } from '@/components/plan-tonight-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressRing } from '@/components/progress-ring';
import { SecondaryButton } from '@/components/secondary-button';
import { StatTile } from '@/components/stat-tile';
import { lessonForDay } from '@/content/lessons';
import { BrandBorderWidth, BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import type { DateKey, DrinkType } from '@/lib/database.types';
import {
  clearEveningPlan,
  closeDay,
  planProgress,
  planVerdict,
  repairStreak,
  setEveningPlan,
} from '@/lib/days';
import { getLessonDayOverride } from '@/lib/dev';
import {
  formatMoney,
  loadWeekSnapshot,
  logDrink,
  moneySaved,
  weekStatus,
  type WeekSnapshot,
} from '@/lib/drinks';
import {
  earnedMilestones,
  milestoneId,
  pendingMilestones,
  recordMilestones,
} from '@/lib/milestones';
import { isReminderResponse, syncEveningReminder } from '@/lib/reminders';
import { formatDayKey, formatLongDate } from '@/lib/week';

export default function TodayScreen() {
  const [snapshot, setSnapshot] = useState<WeekSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [drinkSheetOpen, setDrinkSheetOpen] = useState(false);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [lessonDayOverride, setLessonDayOverride] = useState<number | null>(null);

  /** The day the close sheet is asking about — today, or a forgotten yesterday. */
  const [closingDay, setClosingDay] = useState<DateKey | null>(null);

  /**
   * Drinks logged on this device that the server has not confirmed yet. The
   * ring moves the instant the user taps; this is what it moves by.
   */
  const [pendingDrinks, setPendingDrinks] = useState(0);

  const load = useCallback(async () => {
    const result = await loadWeekSnapshot();
    if (result.ok) {
      setSnapshot(result.value);
      setError(null);
    } else {
      setError(result.message);
    }
  }, []);

  // Re-read on every focus: the week rolls over at midnight on Saturday, and
  // the user may have been looking at another tab when it did.
  useFocusEffect(
    useCallback(() => {
      void load();
      void getLessonDayOverride().then(setLessonDayOverride);
    }, [load])
  );

  /**
   * The device's schedule is reconciled against the profile rather than written
   * once, because the preference travels with the account and the schedule does
   * not — a new phone has no notification pending until something asks for one.
   *
   * This is also the only place the permission prompt can come from today. It
   * belongs in onboarding (PRD §5), which does not exist yet; see follow-ups.
   */
  const reminderWanted = snapshot?.profile.evening_reminder;
  useEffect(() => {
    if (reminderWanted === undefined) return;
    void syncEveningReminder(reminderWanted, { ask: true });
  }, [reminderWanted]);

  /**
   * Tapping the evening nudge lands here and opens the ritual straight away.
   * `useLastNotificationResponse` also replays the tap that cold-started the
   * app, which is exactly what is wanted — and why the identifier is
   * remembered, so it opens once rather than on every mount.
   *
   * Two things have to be true before the tap can be marked as handled, and
   * neither is true at the moment it arrives.
   *
   * The week has to have loaded, because the sheet is opened by naming a day
   * and there is no day to name until then. Marking the tap handled first and
   * asking questions later simply ate it: the effect re-ran when the snapshot
   * landed and returned early on its own bookkeeping.
   *
   * And Today has to be the tab on screen. The sheet belongs to this screen,
   * inactive tabs are detached from the view hierarchy, and the notification
   * can just as easily be tapped while the app was last left on Settings — so
   * the sheet would open somewhere nobody can see it.
   */
  const notificationResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);

  useEffect(() => {
    if (!notificationResponse || !isReminderResponse(notificationResponse)) return;
    if (!snapshot) return;

    const id = notificationResponse.notification.request.identifier;
    if (handledResponse.current === id) return;
    handledResponse.current = id;

    router.navigate('/');
    setClosingDay(snapshot.todayKey);
  }, [notificationResponse, snapshot]);

  /**
   * A milestone is a full screen the user did not ask for, so it fires once and
   * only for the biggest thing that just happened. `shown` guards the window
   * between recording a milestone and the reload that would otherwise find it
   * un-recorded and show it twice.
   *
   * The screen is opened **before** the row is written, and the write is not
   * awaited. Writing first put a network round trip between earning a milestone
   * and seeing it — landing, as often as not, in the middle of the tab
   * transition that triggered the load. And the two failure modes are not equal:
   * a write that lands with no screen loses the celebration for good, while a
   * screen with no write shows it once more next time. Only one of those is
   * recoverable, so that is the one to risk.
   */
  const shown = useRef(new Set<string>());

  useEffect(() => {
    if (!snapshot) return;

    const earned = earnedMilestones(snapshot.streakDays, snapshot.urgesSurvived);
    const { celebrate, record } = pendingMilestones(earned, snapshot.celebrated);
    if (!celebrate || shown.current.has(milestoneId(celebrate))) return;

    for (const key of record) shown.current.add(milestoneId(key));

    router.push({
      pathname: '/milestone',
      params: { kind: celebrate.kind, threshold: String(celebrate.threshold) },
    });

    void recordMilestones(record);
  }, [snapshot]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleLogDrink(drinkType: DrinkType) {
    setPendingDrinks((count) => count + 1);

    const result = await logDrink(drinkType);
    if (!result.ok) {
      setPendingDrinks((count) => count - 1);
      Alert.alert('Not logged', result.message);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Both updates land in one render, so the ring never briefly double-counts
    // the drink that is now in the freshly loaded snapshot.
    await load();
    setPendingDrinks((count) => count - 1);
  }

  async function handlePlan(intended: number) {
    if (!snapshot) return;

    const result = await setEveningPlan(snapshot.todayKey, intended);
    if (!result.ok) {
      Alert.alert('Not saved', result.message);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await load();
  }

  async function handleClearPlan() {
    if (!snapshot) return;
    const result = await clearEveningPlan(snapshot.todayKey);
    if (!result.ok) Alert.alert('Not saved', result.message);
    await load();
  }

  const handleCloseDay = useCallback(
    async (dateKey: DateKey, drinks: number): Promise<boolean> => {
      const result = await closeDay(dateKey, drinks);
      if (!result.ok) {
        Alert.alert('Not closed', result.message);
        return false;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
      return true;
    },
    [load]
  );

  /**
   * Stable, because the close sheet holds the zero-day celebration on a timer
   * keyed to this callback. A fresh identity on every render — and the reload
   * above guarantees one — would restart that timer instead of letting it run.
   */
  const handleCloseSheetDismiss = useCallback(() => setClosingDay(null), []);

  async function handleRepair(dateKey: DateKey) {
    if (!snapshot) return;

    const result = await repairStreak(dateKey, snapshot.week);
    if (!result.ok) {
      Alert.alert('Not repaired', result.message);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await load();
  }

  if (!snapshot) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <PrimaryButton label="Try again" onPress={() => void load()} />
            </>
          ) : (
            <ActivityIndicator color={BrandColor.spruce} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const { profile, timeZone, daysLeft, streakWeeks, urgesSurvived, quickTypes, todayKey } =
    snapshot;
  const target = profile.weekly_target;
  const drinks = snapshot.drinks + pendingDrinks;
  const todayDrinks = snapshot.todayDrinks + pendingDrinks;
  const status = weekStatus(drinks, target, daysLeft);
  const saved = moneySaved(profile.baseline_drinks, drinks, Number(profile.drink_cost));
  const lesson = lessonForDay(lessonDayOverride ?? snapshot.daysSinceJoining + 1);

  const intended = snapshot.plan?.intended_drinks ?? null;
  const closed = snapshot.todayClose !== null;
  const verdict = intended === null ? null : planVerdict(intended, todayDrinks);
  const { rescue, streakDays } = snapshot;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={BrandColor.spruce}
          />
        }>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>THIS WEEK</Text>
          <Text style={styles.title}>{formatLongDate(new Date(), timeZone)}</Text>
        </View>

        <View style={styles.ringBlock}>
          <ProgressRing current={drinks} target={target} />
          <Text
            style={[styles.status, status.tone === 'over' ? styles.statusOver : styles.statusOk]}>
            {status.text}
          </Text>
        </View>

        <View style={styles.tiles}>
          <StatTile
            label="Saved"
            value={formatMoney(saved)}
            caption={
              profile.baseline_drinks > 0
                ? `vs. your usual ${profile.baseline_drinks} a week`
                : 'set your usual week in Settings'
            }
            tone="spruce"
          />
          <StatTile
            label="Streak"
            value={`${streakWeeks}`}
            caption={streakWeeks === 1 ? 'week won' : 'weeks won'}
            tone="spruce"
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Log a drink" onPress={() => setDrinkSheetOpen(true)} />
          <SecondaryButton
            label="Urge"
            onPress={() =>
              router.push({
                pathname: '/urge',
                // Handed over so Urge SOS never has to show a spinner in the
                // one moment where waiting is its own small failure.
                params: { quickTypes: quickTypes.join(',') },
              })
            }
          />
          {urgesSurvived > 0 ? (
            <Text style={styles.urgeTally}>
              {urgesSurvived} {urgesSurvived === 1 ? 'urge' : 'urges'} ridden out
            </Text>
          ) : null}
        </View>

        {/*
          Tonight, in one card: the plan that goes in front of the evening and
          the ritual that closes it. They belong together — the plan is only
          worth making because something later compares against it.
        */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>TONIGHT</Text>
          <Card flush>
            <TonightRow
              label={intended === null ? 'Plan tonight' : `Tonight's plan: ${intended}`}
              caption={
                intended === null
                  ? 'Decide the number now, in two taps.'
                  : planProgress(intended, todayDrinks)
              }
              onPress={() => setPlanSheetOpen(true)}
            />

            <View style={styles.divider} />

            {closed ? (
              /*
                Still tappable. An evening does not always stop when the ritual
                does — someone who closes at eight and has one more at ten has
                to be able to say so, or the app quietly holds a number it knows
                is wrong. Re-closing is deliberate, so it is not the silent
                rewrite `day_closes.drinks` exists to prevent.
              */
              <TonightRow
                label="Day closed"
                caption={`${verdict ? verdict.headline : `${todayDrinks} logged`}${
                  streakDays > 0
                    ? ` · ${streakDays} ${streakDays === 1 ? 'day' : 'days'} in a row`
                    : ''
                }`}
                onPress={() => setClosingDay(todayKey)}
              />
            ) : (
              <TonightRow
                label="Close the day"
                caption={
                  streakDays > 0
                    ? `${streakDays} ${streakDays === 1 ? 'day' : 'days'} in a row so far.`
                    : 'Confirm the count and the day is done.'
                }
                onPress={() => setClosingDay(todayKey)}
              />
            )}
          </Card>
        </View>

        {/*
          The fairness mechanic, and the only place it is visible. It appears
          only when there is something to fix, and it names the day rather than
          the streak — the point is the honest record, not the number.
        */}
        {rescue ? (
          <Card>
            <Text style={styles.rescueTitle}>
              {formatDayKey(rescue.dateKey, todayKey)} is still open
            </Text>
            <Text style={styles.rescueBody}>
              {rescue.kind === 'close'
                ? streakDays > 0
                  ? 'Close it and your run carries on. Nothing is lost by being a day late.'
                  : 'Close it and it counts. Nothing is lost by being a day late.'
                : `Too far back to count honestly, so this one is on us. ${rescue.repairsLeft} repair left this week.`}
            </Text>
            <View style={styles.rescueAction}>
              <SecondaryButton
                label={rescue.kind === 'close' ? 'Close it' : 'Repair my streak'}
                onPress={() =>
                  rescue.kind === 'close'
                    ? setClosingDay(rescue.dateKey)
                    : void handleRepair(rescue.dateKey)
                }
              />
            </View>
          </Card>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Today's lesson: ${lesson.title}`}
          onPress={() => router.push('/lessons')}>
          {({ pressed }) => (
            <Card style={pressed ? styles.lessonPressed : undefined}>
              <Text style={styles.eyebrow}>TODAY&apos;S LESSON · DAY {lesson.day}</Text>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonTeaser}>{lesson.teaser}</Text>
            </Card>
          )}
        </Pressable>
      </ScrollView>

      <LogDrinkSheet
        visible={drinkSheetOpen}
        onClose={() => setDrinkSheetOpen(false)}
        quickTypes={quickTypes}
        onSelect={(drinkType) => void handleLogDrink(drinkType)}
      />

      <PlanTonightSheet
        visible={planSheetOpen}
        onClose={() => setPlanSheetOpen(false)}
        intended={intended}
        onSelect={(count) => void handlePlan(count)}
        onClear={() => void handleClearPlan()}
      />

      {closingDay ? (
        <CloseDaySheet
          visible
          onClose={handleCloseSheetDismiss}
          dateKey={closingDay}
          dayLabel={formatDayKey(closingDay, todayKey)}
          drinks={closingDay === todayKey ? todayDrinks : (snapshot.drinksByDay[closingDay] ?? 0)}
          intended={closingDay === todayKey ? intended : null}
          onConfirm={handleCloseDay}
          onFix={() => {
            setClosingDay(null);
            router.push({
              pathname: '/entries',
              params: { quickTypes: quickTypes.join(',') },
            });
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** One tappable line inside the Tonight card. */
function TonightRow({
  label,
  caption,
  onPress,
}: {
  label: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${caption}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tonightRow, pressed && styles.tonightRowPressed]}>
      <Text style={styles.tonightLabel}>{label}</Text>
      <Text style={styles.tonightCaption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BrandSpace.xl,
    gap: BrandSpace.xl,
  },
  errorText: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: BrandSpace.xl,
    paddingTop: BrandSpace.xl,
    paddingBottom: BrandSpace.xxxl,
    gap: BrandSpace.xxl,
  },
  header: {
    gap: BrandSpace.xs,
  },
  eyebrow: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    letterSpacing: 0.6,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  ringBlock: {
    alignItems: 'center',
    paddingVertical: BrandSpace.sm,
    gap: BrandSpace.lg,
  },
  status: {
    ...BrandType.body,
    textAlign: 'center',
  },
  statusOk: {
    color: BrandColor.spruce,
  },
  statusOver: {
    color: BrandColor.rose,
  },
  tiles: {
    flexDirection: 'row',
    gap: BrandSpace.md,
  },
  actions: {
    gap: BrandSpace.md,
  },
  urgeTally: {
    ...BrandType.caption,
    color: BrandColor.spruce,
    textAlign: 'center',
    marginTop: BrandSpace.xs,
  },
  section: {
    gap: BrandSpace.md,
  },
  divider: {
    height: BrandBorderWidth,
    backgroundColor: BrandColor.line,
  },
  tonightRow: {
    paddingHorizontal: BrandSpace.xl,
    paddingVertical: BrandSpace.lg,
    gap: BrandSpace.xs,
    minHeight: 64,
    justifyContent: 'center',
  },
  tonightRowPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  tonightLabel: {
    ...BrandType.heading,
    color: BrandColor.spruce,
  },
  tonightCaption: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  rescueTitle: {
    ...BrandType.heading,
    color: BrandColor.ink,
  },
  rescueBody: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    marginTop: BrandSpace.xs,
  },
  rescueAction: {
    marginTop: BrandSpace.lg,
  },
  lessonPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  lessonTitle: {
    ...BrandType.heading,
    color: BrandColor.ink,
    marginTop: BrandSpace.sm,
  },
  lessonTeaser: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    marginTop: BrandSpace.xs,
  },
});
