import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import type { DrinkType } from '@/lib/database.types';
import { DRINK_TYPE_LABEL } from '@/lib/drinks';

/** Everything the picker can offer, in the order the expanded row lists them. */
const ALL_TYPES: DrinkType[] = ['beer', 'wine', 'spirits', 'cocktail', 'other'];

export type DrinkTypePickerProps = {
  /** The user's three most-logged types, from `quickTypesFrom`. */
  quickTypes: DrinkType[];
  /** Called with the chosen type. Fires a light haptic first. */
  onSelect: (drinkType: DrinkType) => void;
  /**
   * Collapses "Something else" back down whenever this changes — pass the
   * visibility of whatever contains the picker, so a reopened sheet does not
   * come back with the expanded list still showing and the common path
   * quietly one tap slower.
   */
  resetKey?: unknown;
};

/**
 * Three one-tap buttons for what this user actually drinks, and a quiet way
 * to reach the rest.
 *
 * Shared by the log sheet and the Urge screen so that "log a drink" is the
 * same gesture wherever it happens. There is no quantity stepper and no
 * keyboard: logging has to cost less than not logging, or the week's number
 * stops being true.
 */
export function DrinkTypePicker({ quickTypes, onSelect, resetKey }: DrinkTypePickerProps) {
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
  }, [resetKey]);

  const rest = ALL_TYPES.filter((type) => !quickTypes.includes(type));

  function choose(drinkType: DrinkType) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(drinkType);
  }

  return (
    <View style={styles.container}>
      <View style={styles.quickRow}>
        {quickTypes.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`Log one ${DRINK_TYPE_LABEL[type].toLowerCase()}`}
            onPress={() => choose(type)}
            style={({ pressed }) => [styles.quickTile, pressed && styles.quickTilePressed]}>
            <Text style={styles.quickLabel}>{DRINK_TYPE_LABEL[type]}</Text>
          </Pressable>
        ))}
      </View>

      {showAll ? (
        <View style={styles.chipWrap}>
          {rest.map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={`Log one ${DRINK_TYPE_LABEL[type].toLowerCase()}`}
              onPress={() => choose(type)}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
              <Text style={styles.chipLabel}>{DRINK_TYPE_LABEL[type]}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll(true)}
          style={({ pressed }) => [styles.moreRow, pressed && styles.chipPressed]}>
          <Text style={styles.moreLabel}>Something else</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: BrandSpace.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: BrandSpace.md,
  },
  quickTile: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BrandSpace.sm,
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.card,
  },
  quickTilePressed: {
    backgroundColor: BrandColor.spruceSoft,
    borderColor: BrandColor.spruce,
  },
  quickLabel: {
    ...BrandType.heading,
    color: BrandColor.ink,
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BrandSpace.sm,
  },
  chip: {
    paddingVertical: BrandSpace.md,
    paddingHorizontal: BrandSpace.lg,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.pill,
  },
  chipPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  chipLabel: {
    ...BrandType.label,
    color: BrandColor.ink,
  },
  moreRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BrandRadius.control,
  },
  moreLabel: {
    ...BrandType.label,
    color: BrandColor.spruce,
  },
});
