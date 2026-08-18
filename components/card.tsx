import { StyleSheet, View, type ViewProps } from 'react-native';

import { BrandBorderWidth, BrandColor, BrandRadius, BrandSpace } from '@/constants/brand';

export type CardProps = ViewProps & {
  /** Removes the default padding when the card holds its own layout. */
  flush?: boolean;
};

/**
 * A surface with a hairline border and a 12pt radius.
 * Cards never carry a shadow — separation comes from `BrandColor.line`.
 */
export function Card({ flush = false, style, ...rest }: CardProps) {
  return <View style={[styles.card, flush ? styles.flush : styles.padded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColor.surface,
    borderColor: BrandColor.line,
    borderWidth: BrandBorderWidth,
    borderRadius: BrandRadius.card,
  },
  padded: {
    padding: BrandSpace.xl,
  },
  flush: {
    padding: 0,
  },
});
