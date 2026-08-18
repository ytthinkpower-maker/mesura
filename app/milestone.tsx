import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MilestoneCard, type MilestoneCardHandle } from '@/components/milestone-card';
import { PrimaryButton } from '@/components/primary-button';
import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import type { MilestoneKind } from '@/lib/database.types';
import { milestoneCopy } from '@/lib/milestones';
import { sharePngBase64 } from '@/lib/share-image';

const CARD_WIDTH = 300;

/**
 * A milestone, full screen.
 *
 * The one place the app stops the user rather than waiting to be opened, so it
 * has to earn the interruption: one number, one sentence, and two ways out. No
 * confetti, no sound, no counter racing upwards — the tone is a person saying
 * "look at that", not a machine paying out.
 *
 * Both exits are the same size, because sharing is an offer and not the point.
 */
export default function MilestoneScreen() {
  const params = useLocalSearchParams<{ kind?: string; threshold?: string }>();
  const cardRef = useRef<MilestoneCardHandle>(null);
  const [sharing, setSharing] = useState(false);

  const copy = useMemo(() => {
    const kind: MilestoneKind = params.kind === 'urges_survived' ? 'urges_survived' : 'day_streak';
    const threshold = Number(params.threshold) || 0;
    return { key: { kind, threshold }, ...milestoneCopy({ kind, threshold }) };
  }, [params.kind, params.threshold]);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);

    const base64 = await cardRef.current?.toPngBase64();
    if (!base64) {
      setSharing(false);
      Alert.alert('Could not make the image', 'Try again in a moment.');
      return;
    }

    const result = await sharePngBase64(
      base64,
      `mesura-${copy.key.kind.replace(/_/g, '-')}-${copy.key.threshold}.png`
    );

    setSharing(false);
    if (!result.ok) Alert.alert('Could not share', result.message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.cardBlock}>
          <MilestoneCard ref={cardRef} figure={copy.figure} unit={copy.unit} width={CARD_WIDTH} />
        </View>

        <Text style={styles.line}>{copy.line}</Text>

        <View style={styles.actions}>
          <PrimaryButton
            label={sharing ? 'Preparing…' : 'Share'}
            disabled={sharing}
            onPress={() => void handleShare()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.quietRow, pressed && styles.pressed]}>
            <Text style={styles.quietLabel}>Done</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: BrandSpace.xl,
    paddingVertical: BrandSpace.xxl,
    gap: BrandSpace.xl,
  },
  cardBlock: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  line: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
    textAlign: 'center',
    paddingHorizontal: BrandSpace.md,
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
  pressed: {
    opacity: 0.6,
  },
});
