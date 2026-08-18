import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ProgressRing } from '@/components/progress-ring';
import { StatTile } from '@/components/stat-tile';
import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';

// Placeholder figures until the real weekly store lands.
const DEMO_CURRENT = 5;
const DEMO_TARGET = 8;

export default function TodayScreen() {
  const left = Math.max(DEMO_TARGET - DEMO_CURRENT, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>THIS WEEK</Text>
          <Text style={styles.title}>Today</Text>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing current={DEMO_CURRENT} target={DEMO_TARGET} />
        </View>

        <View style={styles.tiles}>
          <StatTile label="Left" value={`${left}`} caption="drinks" tone="spruce" />
          <StatTile label="Streak" value="2" caption="weeks won" tone="spruce" />
        </View>

        <Card>
          <Text style={styles.cardHeading}>Your week so far</Text>
          <Text style={styles.aiText}>
            You&apos;re three under your number with two days to go — the same pace that won you
            last week.
          </Text>
          <Text style={styles.aiLabel}>AI-generated</Text>
        </Card>

        <PrimaryButton label="Log a drink" onPress={() => {}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    paddingHorizontal: BrandSpace.xl,
    paddingTop: BrandSpace.xl,
    paddingBottom: BrandSpace.xxxl,
    gap: BrandSpace.xxl,
  },
  header: {
    gap: BrandSpace.xs,
  },
  eyebrow: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    letterSpacing: 0.6,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: BrandSpace.sm,
  },
  tiles: {
    flexDirection: 'row',
    gap: BrandSpace.md,
  },
  cardHeading: {
    ...BrandType.heading,
    color: BrandColor.ink,
    marginBottom: BrandSpace.sm,
  },
  aiText: {
    ...BrandType.body,
    color: BrandColor.slate,
  },
  aiLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
    marginTop: BrandSpace.md,
  },
});
