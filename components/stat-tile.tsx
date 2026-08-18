import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';

export type StatTileProps = {
  /** Short, quiet label above the value. */
  label: string;
  /** The number or short string this tile exists to show. */
  value: string;
  /** Optional supporting line under the value. */
  caption?: string;
  /**
   * `over` is the only non-spruce tone, for over-target numbers.
   * Wins and everything neutral-positive stay spruce.
   */
  tone?: 'default' | 'spruce' | 'over';
};

export function StatTile({ label, value, caption, tone = 'default' }: StatTileProps) {
  const valueColor =
    tone === 'over' ? BrandColor.rose : tone === 'spruce' ? BrandColor.spruce : BrandColor.ink;

  return (
    <Card style={styles.tile}>
      <View style={styles.stack}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: BrandSpace.lg,
  },
  stack: {
    gap: BrandSpace.xs,
  },
  label: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    letterSpacing: 0.6,
  },
  value: {
    ...BrandType.title,
  },
  caption: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
});
