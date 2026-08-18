import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import type { UrgeOutcome } from '@/lib/database.types';

export type UrgeSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with how the urge went. The sheet has already closed by then. */
  onSelect: (outcome: UrgeOutcome) => void;
};

/**
 * What happened with the urge, in one tap.
 *
 * Both answers are logged, and neither is scored against the user: an urge
 * that ended in a drink is still information, and asking for it is how the
 * tally of the other kind stays true. Riding one out is the win — it renders
 * in spruce, like every other win in this app.
 */
export function UrgeSheet({ visible, onClose, onSelect }: UrgeSheetProps) {
  function choose(outcome: UrgeOutcome) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onSelect(outcome);
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Feeling the urge"
      subtitle="Logging it either way is the point.">
      <Pressable
        accessibilityRole="button"
        onPress={() => choose('survived')}
        style={({ pressed }) => [styles.option, styles.win, pressed && styles.winPressed]}>
        <View style={styles.stack}>
          <Text style={styles.winLabel}>I rode it out</Text>
          <Text style={styles.winCaption}>Counts as a win, and your week stays where it is</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => choose('drank')}
        style={({ pressed }) => [styles.option, styles.plain, pressed && styles.plainPressed]}>
        <View style={styles.stack}>
          <Text style={styles.plainLabel}>I had one</Text>
          <Text style={styles.plainCaption}>Log the drink next — no judgement either way</Text>
        </View>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 72,
    justifyContent: 'center',
    paddingVertical: BrandSpace.lg,
    paddingHorizontal: BrandSpace.xl,
    borderRadius: BrandRadius.card,
    borderWidth: BrandBorderWidth,
  },
  stack: {
    gap: BrandSpace.xs,
  },
  win: {
    backgroundColor: BrandColor.spruce,
    borderColor: BrandColor.spruce,
  },
  winPressed: {
    backgroundColor: BrandColor.sprucePressed,
    borderColor: BrandColor.sprucePressed,
  },
  winLabel: {
    ...BrandType.heading,
    color: BrandColor.onSpruce,
  },
  winCaption: {
    ...BrandType.caption,
    color: BrandColor.onSpruce,
    opacity: 0.85,
  },
  plain: {
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
  },
  plainPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  plainLabel: {
    ...BrandType.heading,
    color: BrandColor.ink,
  },
  plainCaption: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
});
