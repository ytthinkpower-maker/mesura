import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';

export type PlaceholderScreenProps = {
  /** Tab name, shown as the screen heading. */
  title: string;
  /** One line on what this tab will eventually do. */
  summary: string;
};

/**
 * Temporary screen body used by the tabs that have no real content yet.
 * Delete this component once no route imports it.
 */
export function PlaceholderScreen({ title, summary }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Coming in a later step</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: BrandSpace.md,
    paddingHorizontal: BrandSpace.xl,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  summary: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: BrandSpace.lg,
    paddingHorizontal: BrandSpace.lg,
    paddingVertical: BrandSpace.sm,
    borderRadius: BrandRadius.pill,
    backgroundColor: BrandColor.spruceSoft,
  },
  badgeLabel: {
    ...BrandType.label,
    color: BrandColor.spruce,
  },
});
