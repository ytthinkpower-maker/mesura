import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BREATH_CYCLE_MS,
  BREATH_HOLD_MS,
  BREATH_IN_MS,
  BREATH_LABEL,
  BreathingCircle,
  type BreathPhase,
} from '@/components/breathing-circle';
import { DrinkTypePicker } from '@/components/drink-type-picker';
import { PrimaryButton } from '@/components/primary-button';
import { nextSwapSuggestion } from '@/content/swaps';
import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import type { DrinkType } from '@/lib/database.types';
import { logDrink, logUrge } from '@/lib/drinks';

/** How long the guided breathing runs before the circle comes to rest. */
const SESSION_MS = 90_000;

/** How long the win state holds before the screen returns to Today. */
const WIN_MS = 1600;

/** Fine enough that the countdown never visibly stutters. */
const TICK_MS = 100;

type Stage = 'breathing' | 'logging-drink' | 'won';

/** Where in the 14-second cycle `elapsed` falls. */
function phaseAt(elapsed: number): BreathPhase {
  if (elapsed >= SESSION_MS) return 'done';
  const withinCycle = elapsed % BREATH_CYCLE_MS;
  if (withinCycle < BREATH_IN_MS) return 'in';
  if (withinCycle < BREATH_IN_MS + BREATH_HOLD_MS) return 'hold';
  return 'out';
}

/**
 * Urge SOS.
 *
 * The emotional core of the product: the one screen that exists to reward
 * something the user does not do. Every decision here is in service of feeling
 * like a deep breath rather than a form — the breathing circle is the subject,
 * the note is optional and unlabelled, and the way out that ends in a drink is
 * as quiet and unpunished as the way out that does not.
 */
export default function UrgeScreen() {
  const params = useLocalSearchParams<{ quickTypes?: string }>();

  /**
   * Passed in from Today rather than re-queried. This screen opens in a moment
   * where a spinner would be its own small failure, and Today already knows.
   */
  const quickTypes = useMemo<DrinkType[]>(() => {
    const passed = params.quickTypes?.split(',').filter(Boolean) as DrinkType[] | undefined;
    return passed?.length ? passed : ['beer', 'wine', 'cocktail'];
  }, [params.quickTypes]);

  /** One suggestion per visit, and never the same one twice running. */
  const swap = useMemo(() => nextSwapSuggestion(), []);

  const [stage, setStage] = useState<Stage>('breathing');
  const [note, setNote] = useState('');
  const [phase, setPhase] = useState<BreathPhase>('in');
  const [secondsLeft, setSecondsLeft] = useState(Math.round(SESSION_MS / 1000));
  const [busy, setBusy] = useState(false);

  const startedAt = useRef(Date.now());

  /**
   * One clock drives the phase label, the circle, and the countdown. Each tick
   * recomputes from the start time rather than incrementing, so nothing drifts
   * over ninety seconds and the label can never contradict the animation.
   */
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setPhase(phaseAt(elapsed));
      setSecondsLeft(Math.max(0, Math.ceil((SESSION_MS - elapsed) / 1000)));
      if (elapsed >= SESSION_MS) clearInterval(id);
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  async function handleRodeItOut() {
    if (busy) return;
    setBusy(true);

    const result = await logUrge('survived', note);
    if (!result.ok) {
      setBusy(false);
      setStage('breathing');
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStage('won');
    setTimeout(() => router.back(), WIN_MS);
  }

  async function handleHadTheDrink(drinkType: DrinkType) {
    if (busy) return;
    setBusy(true);

    // The urge is recorded either way — a tally of urges survived is only true
    // if the ones that were not survived are counted too.
    await logUrge('drank', note);
    await logDrink(drinkType);
    router.back();
  }

  if (stage === 'won') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.winPage}>
          <BreathingCircle phase="done" size={220}>
            <Text style={styles.winMark}>✓</Text>
          </BreathingCircle>
          <Text style={styles.winText}>Urge survived — that&apos;s a win</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={BrandSpace.lg}
            style={({ pressed }) => [styles.close, pressed && styles.pressedQuiet]}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>

          <View style={styles.headings}>
            <Text style={styles.headline}>Riding it out</Text>
            <Text style={styles.subline}>Most urges pass in about 20 minutes.</Text>
          </View>

          <View style={styles.circleBlock}>
            <BreathingCircle phase={phase} size={224}>
              <Text style={styles.phaseLabel}>{BREATH_LABEL[phase]}</Text>
              <Text style={styles.countdown}>
                {phase === 'done' ? 'Take as long as you need' : `${secondsLeft}s`}
              </Text>
            </BreathingCircle>
          </View>

          {stage === 'logging-drink' ? (
            <View style={styles.drinkBlock}>
              <Text style={styles.drinkPrompt}>What was it?</Text>
              <DrinkTypePicker
                quickTypes={quickTypes}
                onSelect={(drinkType) => void handleHadTheDrink(drinkType)}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setStage('breathing')}
                style={({ pressed }) => [styles.quietRow, pressed && styles.pressedQuiet]}>
                <Text style={styles.quietLabel}>Back to breathing</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.noteBlock}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What triggered this?"
                  placeholderTextColor={BrandColor.inkMuted}
                  selectionColor={BrandColor.spruce}
                  accessibilityLabel="What triggered this?"
                  returnKeyType="done"
                  maxLength={500}
                  style={styles.noteInput}
                />
              </View>

              <View style={styles.swapBlock}>
                <Text style={styles.swapEyebrow}>INSTEAD</Text>
                <Text style={styles.swapText}>{swap}</Text>
              </View>

              <View style={styles.actions}>
                <PrimaryButton
                  label="I rode it out — count it"
                  disabled={busy}
                  onPress={() => void handleRodeItOut()}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStage('logging-drink')}
                  style={({ pressed }) => [styles.quietRow, pressed && styles.pressedQuiet]}>
                  <Text style={styles.quietLabel}>I had the drink</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: BrandSpace.xl,
    paddingTop: BrandSpace.md,
    paddingBottom: BrandSpace.xxl,
    gap: BrandSpace.xl,
  },
  close: {
    alignSelf: 'flex-start',
    paddingVertical: BrandSpace.xs,
  },
  closeLabel: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  pressedQuiet: {
    opacity: 0.6,
  },
  headings: {
    gap: BrandSpace.sm,
  },
  headline: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  subline: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  circleBlock: {
    alignItems: 'center',
    paddingVertical: BrandSpace.sm,
  },
  phaseLabel: {
    ...BrandType.heading,
    color: BrandColor.spruce,
  },
  countdown: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
  noteBlock: {
    gap: BrandSpace.sm,
  },
  /**
   * Deliberately unlike `TextField`: no label, no box. A labelled input in a
   * bordered card is what makes a screen read as a form, and this one is
   * optional in every sense.
   */
  noteInput: {
    ...BrandType.body,
    lineHeight: undefined,
    color: BrandColor.ink,
    paddingVertical: BrandSpace.md,
    borderBottomWidth: BrandBorderWidth,
    borderBottomColor: BrandColor.line,
  },
  swapBlock: {
    gap: BrandSpace.xs,
    padding: BrandSpace.lg,
    borderRadius: BrandRadius.card,
    backgroundColor: BrandColor.spruceSoft,
  },
  swapEyebrow: {
    ...BrandType.caption,
    color: BrandColor.spruce,
    letterSpacing: 0.6,
  },
  swapText: {
    ...BrandType.body,
    color: BrandColor.ink,
  },
  actions: {
    marginTop: 'auto',
    gap: BrandSpace.md,
  },
  quietRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietLabel: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  drinkBlock: {
    marginTop: 'auto',
    gap: BrandSpace.lg,
  },
  drinkPrompt: {
    ...BrandType.heading,
    color: BrandColor.ink,
  },
  winPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BrandSpace.xl,
    gap: BrandSpace.xxl,
  },
  winMark: {
    ...BrandType.display,
    color: BrandColor.spruce,
  },
  winText: {
    ...BrandType.title,
    color: BrandColor.spruce,
    textAlign: 'center',
  },
});
