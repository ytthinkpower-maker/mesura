import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { LogDrinkSheet } from '@/components/log-drink-sheet';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressRing } from '@/components/progress-ring';
import { SecondaryButton } from '@/components/secondary-button';
import { StatTile } from '@/components/stat-tile';
import { lessonForDay } from '@/content/lessons';
import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import type { DrinkType } from '@/lib/database.types';
import {
  formatMoney,
  loadWeekSnapshot,
  logDrink,
  moneySaved,
  weekStatus,
  type WeekSnapshot,
} from '@/lib/drinks';
import { formatLongDate } from '@/lib/week';

export default function TodayScreen() {
  const [snapshot, setSnapshot] = useState<WeekSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [drinkSheetOpen, setDrinkSheetOpen] = useState(false);

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
    }, [load])
  );

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

  const { profile, timeZone, daysLeft, streakWeeks, urgesSurvived, quickTypes } = snapshot;
  const target = profile.weekly_target;
  const drinks = snapshot.drinks + pendingDrinks;
  const status = weekStatus(drinks, target, daysLeft);
  const saved = moneySaved(profile.baseline_drinks, drinks, Number(profile.drink_cost));
  const lesson = lessonForDay(snapshot.daysSinceJoining + 1);

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
    </SafeAreaView>
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
