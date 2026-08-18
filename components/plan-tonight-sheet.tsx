import { Pressable, StyleSheet, Text } from 'react-native';

import { CountPicker } from '@/components/count-picker';
import { Sheet } from '@/components/sheet';
import { BrandColor, BrandType } from '@/constants/brand';
import { PLAN_CHOICES } from '@/lib/days';

export type PlanTonightSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Tonight's plan, if one has already been made. */
  intended: number | null;
  /** Called with the chosen count. The sheet has already closed by then. */
  onSelect: (intended: number) => void;
  /** Called when the user takes the plan back. Only offered once one exists. */
  onClear: () => void;
};

/**
 * Two taps: open, choose. That is the whole interaction.
 *
 * Deciding in advance is the half of moderation that logging afterwards cannot
 * do, and it only works if it is cheaper than not deciding. So there is no
 * confirm button and no way to get this wrong — picking a different number just
 * replaces the plan.
 */
export function PlanTonightSheet({
  visible,
  onClose,
  intended,
  onSelect,
  onClear,
}: PlanTonightSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Plan tonight"
      subtitle="How many are you having? Pick one and the evening is decided.">
      <CountPicker
        choices={PLAN_CHOICES}
        selected={intended}
        onSelect={(count) => {
          onClose();
          onSelect(count);
        }}
      />

      {intended !== null ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            onClear();
          }}
          style={({ pressed }) => [styles.clearRow, pressed && styles.pressed]}>
          <Text style={styles.clearLabel}>Take the plan back</Text>
        </Pressable>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  clearRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  pressed: {
    opacity: 0.6,
  },
});
