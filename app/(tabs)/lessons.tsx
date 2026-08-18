import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';

export default function LessonsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Lessons</Text>
          <Text style={styles.summary}>
            Short, practical reads that make the next week easier to hit.
          </Text>
        </View>

        <Card>
          <Text style={styles.lessonTitle}>Why a number beats a rule</Text>
          {/* Lesson body copy is the only place the serif face is used. */}
          <Text style={styles.lessonBody}>
            A rule like &ldquo;only on weekends&rdquo; breaks the first time the week is unusual. A
            number you chose bends instead: you spend it how you like, and you still know where you
            stand on Sunday night.
          </Text>
        </Card>

        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>More lessons in a later step</Text>
        </View>
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
    gap: BrandSpace.xl,
  },
  header: {
    gap: BrandSpace.sm,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  summary: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  lessonTitle: {
    ...BrandType.heading,
    color: BrandColor.ink,
    marginBottom: BrandSpace.md,
  },
  lessonBody: {
    ...BrandType.lessonBody,
    color: BrandColor.ink,
  },
  badge: {
    alignSelf: 'flex-start',
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
