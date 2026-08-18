import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';

import {
  BrandBorderWidth,
  BrandColor,
  BrandRadius,
  BrandSpace,
  BrandType,
} from '@/constants/brand';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field in `rose`. Also marks the field itself. */
  error?: string | null;
  /** Extra type styling for the input itself, e.g. a spaced-out code field. */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Masks the value and adds a Show/Hide control. Use this instead of passing
   * `secureTextEntry` directly — a password you cannot read is a password you
   * mistype, and there is no "confirm" field to catch it on sign-in.
   */
  revealable?: boolean;
};

/**
 * A single-line text input in the brand system: `surface` fill, hairline
 * border, no shadow. The border turns spruce on focus — the only affordance
 * the field needs.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, inputStyle, revealable = false, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const masked = revealable ? !revealed : rest.secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={BrandColor.inkMuted}
          selectionColor={BrandColor.spruce}
          {...rest}
          secureTextEntry={masked}
          style={[
            styles.input,
            focused && styles.inputFocused,
            !!error && styles.inputError,
            revealable && styles.inputWithToggle,
            inputStyle,
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {revealable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Hide ${label}` : `Show ${label}`}
            hitSlop={BrandSpace.md}
            onPress={() => setRevealed((current) => !current)}
            style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}>
            <Text style={styles.toggleLabel}>{revealed ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: BrandSpace.sm,
  },
  label: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  inputRow: {
    justifyContent: 'center',
  },
  input: {
    ...BrandType.body,
    /**
     * iOS clips descenders — the tail of a j, g, or y — in a TextInput that
     * carries an explicit lineHeight, because it centres the glyphs in a line
     * box sized to that value. `BrandType.body` sets one for running text, where
     * it is correct; a single-line input has to drop it and let the font decide.
     */
    lineHeight: undefined,
    color: BrandColor.ink,
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.control,
    paddingHorizontal: BrandSpace.lg,
    paddingVertical: BrandSpace.lg,
    minHeight: 52,
  },
  /** Keeps a long password from running under the Show control. */
  inputWithToggle: {
    paddingRight: BrandSpace.xxxl + BrandSpace.lg,
  },
  toggle: {
    position: 'absolute',
    right: BrandSpace.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  togglePressed: {
    opacity: 0.6,
  },
  toggleLabel: {
    ...BrandType.label,
    color: BrandColor.spruce,
  },
  inputFocused: {
    borderColor: BrandColor.spruce,
  },
  inputError: {
    borderColor: BrandColor.rose,
  },
  error: {
    ...BrandType.caption,
    color: BrandColor.rose,
  },
});
