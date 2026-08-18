import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
};

/** The one call-to-action style: a spruce pill. No gradient, no shadow. */
export function PrimaryButton({ label, disabled, ...rest }: PrimaryButtonProps) {
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
    backgroundColor: BrandColor.spruce,
    borderRadius: BrandRadius.pill,
    paddingVertical: BrandSpace.lg,
    paddingHorizontal: BrandSpace.xxl,
    minHeight: 52,
  },
  pressed: {
    backgroundColor: BrandColor.sprucePressed,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...BrandType.label,
    fontSize: 16,
    color: BrandColor.onSpruce,
  },
});
