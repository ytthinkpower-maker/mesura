import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';
import { DRINK_TYPE_LABEL } from '@/lib/drinks';
import type { DrinkType } from '@/lib/database.types';

/** Everything the sheet can offer, in the order the extra row lists them. */
const ALL_TYPES: DrinkType[] = ['beer', 'wine', 'spirits', 'cocktail', 'other'];

export type LogDrinkSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The user's three most-logged types, from `quickTypesFrom`. */
  quickTypes: DrinkType[];
  /** Called with the chosen type. The sheet has already closed by then. */
  onSelect: (drinkType: DrinkType) => void;
};

/**
 * One tap logs a drink and the sheet closes itself.
 *
 * The three buttons across the top are what this user actually drinks, so the
 * common case is a single tap on a target the thumb cannot miss. Anything
 * rarer is one tap away under "Something else". There is no quantity stepper
 * and no keyboard anywhere in here: logging has to cost less than not logging,
 * or the week's number stops being true.
 */
export function LogDrinkSheet({ visible, onClose, quickTypes, onSelect }: LogDrinkSheetProps) {
  const [showAll, setShowAll] = useState(false);

  // A sheet that reopens still showing the expanded list has quietly made the
  // common path slower.
  useEffect(() => {
    if (visible) setShowAll(false);
  }, [visible]);

  const rest = ALL_TYPES.filter((type) => !quickTypes.includes(type));

  function choose(drinkType: DrinkType) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onSelect(drinkType);
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Log a drink" subtitle="One tap. That's it.">
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
