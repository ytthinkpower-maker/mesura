import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
// The gesture handler's own ScrollView, so a horizontal swipe on a row and a
// vertical scroll of the list never fight over the same finger.
import { ScrollView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { DrinkTypePicker } from '@/components/drink-type-picker';
import { Sheet } from '@/components/sheet';
import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import type { DateKey, DrinkType } from '@/lib/database.types';
import { BACKFILL_DAYS_BACK } from '@/lib/days';
import {
  backfillInstant,
  deleteDrinkLog,
  DRINK_TYPE_LABEL,
  loadEditableEntries,
  logDrink,
  updateDrinkLog,
  type DrinkEntry,
} from '@/lib/drinks';
import { deviceTimeZone, formatDayKey, formatTime, localDateKey, shiftDateKey } from '@/lib/week';

/** Width of the panel revealed behind a row, and how far a swipe must travel. */
const SWIPE_ACTION_WIDTH = 96;
const SWIPE_THRESHOLD = 72;

/**
 * Correcting the record.
 *
 * The reason this screen exists is loss aversion pointed the right way: a
 * tracker that cannot be corrected is one people abandon the first time it is
 * wrong, and a streak that dies because someone fell asleep is the single
 * biggest one-star driver in this category. So everything here is reversible
 * and nothing is punished — adding a drink you forgot is exactly as easy as
 * logging one at the time.
 *
 * The window is today and yesterday. That boundary is stated on the screen
 * rather than enforced silently, because a limit the user can see is a rule and
 * a limit they cannot is a bug.
 */
export default function EntriesScreen() {
  const params = useLocalSearchParams<{ quickTypes?: string }>();

  const quickTypes = useMemo<DrinkType[]>(() => {
    const passed = params.quickTypes?.split(',').filter(Boolean) as DrinkType[] | undefined;
    return passed?.length ? passed : ['beer', 'wine', 'cocktail'];
  }, [params.quickTypes]);

  const timeZone = useMemo(() => deviceTimeZone(), []);
  const todayKey = useMemo(() => localDateKey(new Date(), timeZone), [timeZone]);

  const [entries, setEntries] = useState<DrinkEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingFor, setAddingFor] = useState<DateKey | null>(null);
  const [editing, setEditing] = useState<DrinkEntry | null>(null);

  const load = useCallback(async () => {
    const result = await loadEditableEntries();
    if (result.ok) {
      setEntries(result.value);
      setError(null);
    } else {
      setError(result.message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** The days this screen covers, newest first. */
  const dayKeys = useMemo(
    () =>
      Array.from({ length: BACKFILL_DAYS_BACK + 1 }, (_, back) => shiftDateKey(todayKey, -back)),
    [todayKey]
  );

  const byDay = useMemo(() => {
    const groups: Record<DateKey, DrinkEntry[]> = {};
    for (const key of dayKeys) groups[key] = [];

    for (const entry of entries ?? []) {
      const key = localDateKey(new Date(entry.logged_at), timeZone);
      if (groups[key]) groups[key].push(entry);
    }

    return groups;
  }, [entries, dayKeys, timeZone]);

  async function handleAdd(dateKey: DateKey, drinkType: DrinkType) {
    setAddingFor(null);
    setBusy(true);

    const result = await logDrink(drinkType, 1, backfillInstant(dateKey, timeZone));
    if (!result.ok) {
      setBusy(false);
      Alert.alert('Not added', result.message);
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await load();
    setBusy(false);
  }

  async function handleChangeType(entry: DrinkEntry, drinkType: DrinkType) {
    setEditing(null);
    setBusy(true);

    const result = await updateDrinkLog(entry.id, drinkType);
    if (!result.ok) Alert.alert('Not changed', result.message);

    await load();
    setBusy(false);
  }

  async function performDelete(entry: DrinkEntry) {
    setBusy(true);

    const result = await deleteDrinkLog(entry.id);
    if (result.ok) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Alert.alert('Not deleted', result.message);

    await load();
    setBusy(false);
  }

  /**
   * Swiping deletes on the spot, with no confirmation.
   *
   * The gesture is the confirmation: a deliberate pull most of the way across a
   * row is not something a thumb does by accident, and iOS has spent fifteen
   * years teaching people exactly what it means. Asking again afterwards would
   * make the fast path slower than the slow one, which is the whole reason it
   * exists.
   *
   * What makes that safe is the cost of being wrong. One drink is two taps to
   * put back — the row above says "Add one to today" — so the worst case is a
   * few seconds, not lost history.
   */
  function handleSwipeDelete(entry: DrinkEntry) {
    void performDelete(entry);
  }

  /**
   * The sheet's delete keeps its confirmation. It is reached by tapping a row to
   * change its type, so a mis-tap onto a destructive line is genuinely possible
   * there in a way a full swipe is not.
   */
  function handleDelete(entry: DrinkEntry) {
    setEditing(null);
    Alert.alert('Delete this entry?', 'It comes off your week straight away.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void performDelete(entry) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={BrandSpace.lg}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeLabel}>Done</Text>
        </Pressable>

        <View style={styles.headings}>
          <Text style={styles.title}>Your entries</Text>
          <Text style={styles.subtitle}>
            Today and yesterday can still be changed. Tap one to retype it, swipe it left to delete
            it. Anything older is left as it was.
          </Text>
        </View>

        {entries === null ? (
          <View style={styles.centered}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <ActivityIndicator color={BrandColor.spruce} />
            )}
          </View>
        ) : (
          dayKeys.map((dateKey) => (
            <View key={dateKey} style={styles.section}>
              <Text style={styles.sectionLabel}>
                {formatDayKey(dateKey, todayKey).toUpperCase()}
              </Text>

              <Card flush style={styles.dayCard}>
                {byDay[dateKey].length === 0 ? (
                  <Text style={styles.empty}>Nothing logged.</Text>
                ) : (
                  byDay[dateKey].map((entry, index) => (
                    <View key={entry.id}>
                      {index > 0 ? <View style={styles.divider} /> : null}
                      <ReanimatedSwipeable
                        friction={2}
                        rightThreshold={SWIPE_THRESHOLD}
                        overshootRight={false}
                        enabled={!busy}
                        renderRightActions={() => (
                          <View style={styles.swipeAction}>
                            <Text style={styles.swipeActionLabel}>Delete</Text>
                          </View>
                        )}
                        // Fires the moment the swipe commits, so the row leaves
                        // with the gesture rather than after it.
                        onSwipeableWillOpen={() => handleSwipeDelete(entry)}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${DRINK_TYPE_LABEL[entry.drink_type]} at ${formatTime(new Date(entry.logged_at), timeZone)}`}
                          accessibilityHint="Swipe left to delete"
                          disabled={busy}
                          onPress={() => setEditing(entry)}
                          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                          <Text style={styles.rowType}>{DRINK_TYPE_LABEL[entry.drink_type]}</Text>
                          <Text style={styles.rowTime}>
                            {formatTime(new Date(entry.logged_at), timeZone)}
                          </Text>
                        </Pressable>
                      </ReanimatedSwipeable>
                    </View>
                  ))
                )}
              </Card>

              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setAddingFor(dateKey)}
                style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}>
                <Text style={styles.addLabel}>
                  Add one to {formatDayKey(dateKey, todayKey).toLowerCase()}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <Sheet
        visible={addingFor !== null}
        onClose={() => setAddingFor(null)}
        title="A drink you forgot"
        subtitle={
          addingFor
            ? `Logging it to ${formatDayKey(addingFor, todayKey).toLowerCase()}.`
            : undefined
        }>
        <DrinkTypePicker
          quickTypes={quickTypes}
          resetKey={addingFor}
          onSelect={(drinkType) => addingFor && void handleAdd(addingFor, drinkType)}
        />
      </Sheet>

      <Sheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title="Change this entry"
        subtitle={
          editing
            ? `Logged at ${formatTime(new Date(editing.logged_at), timeZone)}. Pick what it really was.`
            : undefined
        }>
        <DrinkTypePicker
          quickTypes={quickTypes}
          resetKey={editing?.id}
          onSelect={(drinkType) => editing && void handleChangeType(editing, drinkType)}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => editing && handleDelete(editing)}
          style={({ pressed }) => [styles.deleteRow, pressed && styles.pressed]}>
          <Text style={styles.deleteLabel}>Delete this entry</Text>
        </Pressable>
      </Sheet>
    </SafeAreaView>
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
  centered: {
    paddingVertical: BrandSpace.xxxl,
    alignItems: 'center',
  },
  errorText: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    textAlign: 'center',
  },
  section: {
    gap: BrandSpace.sm,
  },
  sectionLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    letterSpacing: 0.6,
  },
  divider: {
    height: BrandBorderWidth,
    backgroundColor: BrandColor.line,
  },
  dayCard: {
    // The delete panel lives behind the row, so the card has to clip it or it
    // squares off the rounded corners as it slides out.
    overflow: 'hidden',
  },
  swipeAction: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColor.rose,
  },
  swipeActionLabel: {
    ...BrandType.label,
    color: BrandColor.onSpruce,
  },
  row: {
    // Opaque on purpose: the row slides over the rose panel, and a transparent
    // background would let the panel show straight through it.
    backgroundColor: BrandColor.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BrandSpace.lg,
    paddingVertical: BrandSpace.lg,
    minHeight: 52,
  },
  rowPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  rowType: {
    ...BrandType.body,
    color: BrandColor.ink,
  },
  rowTime: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  empty: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    padding: BrandSpace.lg,
  },
  addRow: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: BrandSpace.lg,
    borderRadius: BrandRadius.control,
  },
  addRowPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  addLabel: {
    ...BrandType.label,
    color: BrandColor.spruce,
  },
  deleteRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    ...BrandType.label,
    color: BrandColor.rose,
  },
});
