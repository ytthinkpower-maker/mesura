import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';

export type SecondaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
};

/**
 * The second action on a screen: an outlined spruce pill, same size and weight
 * as `PrimaryButton` but unfilled.
 *
 * Used where two actions are genuinely equal in importance and only one can
 * carry the fill — on Today, logging a drink and riding out an urge. Still no
 * shadow and no gradient; the hairline does the work.
 */
export function SecondaryButton({ label, disabled, ...rest }: SecondaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.spruce,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.pill,
    paddingVertical: BrandSpace.lg,
    paddingHorizontal: BrandSpace.xxl,
    minHeight: 52,
  },
  pressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...BrandType.label,
    fontSize: 16,
    color: BrandColor.spruce,
  },
});
