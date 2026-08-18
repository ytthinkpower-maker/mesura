import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';

export type CountPickerProps = {
  /** The numbers to offer, in order. */
  choices: readonly number[];
  /** The one currently chosen, if any. */
  selected?: number | null;
  /** Called with the chosen number. Fires a light haptic first. */
  onSelect: (count: number) => void;
};

/**
 * A row of numbers, one tap each.
 *
 * The same rule as the drink picker: no stepper, no keyboard, no confirm. A
 * plan that takes four taps to make is a plan most people will not bother
 * making, and an unmade plan cannot be stuck to.
 */
export function CountPicker({ choices, selected = null, onSelect }: CountPickerProps) {
  function choose(count: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(count);
  }

  return (
    <View style={styles.row}>
      {choices.map((count) => {
        const isSelected = selected === count;

        return (
          <Pressable
            key={count}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={count === 0 ? 'None tonight' : `${count} tonight`}
            onPress={() => choose(count)}
            style={({ pressed }) => [
              styles.tile,
              isSelected && styles.tileSelected,
              pressed && (isSelected ? styles.tileSelectedPressed : styles.tilePressed),
            ]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: BrandSpace.sm,
  },
  tile: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.card,
  },
  tileSelected: {
    backgroundColor: BrandColor.spruce,
    borderColor: BrandColor.spruce,
  },
  tilePressed: {
    backgroundColor: BrandColor.spruceSoft,
    borderColor: BrandColor.spruce,
  },
  tileSelectedPressed: {
    backgroundColor: BrandColor.sprucePressed,
    borderColor: BrandColor.sprucePressed,
  },
  label: {
    ...BrandType.title,
    color: BrandColor.ink,
  },
  labelSelected: {
    color: BrandColor.onSpruce,
  },
});
