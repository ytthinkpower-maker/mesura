import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';

export type AuthScreenProps = ViewProps & {
  title: string;
  /** One plain sentence. Says what this screen wants, not what it is. */
  subtitle?: string;
  /** A whole-form problem, shown above the button in a quiet rose wash. */
  error?: string | null;
  /** A whole-form confirmation, shown in the same slot in spruce. */
  notice?: string | null;
};

/**
 * The shell every auth screen sits in: paper background, generous whitespace,
 * one column, keyboard-aware. Screens supply their own fields and button.
 */
export function AuthScreen({
  title,
  subtitle,
  error,
  notice,
  children,
  style,
  ...rest
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + BrandSpace.xxxl,
            paddingBottom: insets.bottom + BrandSpace.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {error ? (
          <View style={[styles.banner, styles.bannerError]}>
            <Text style={styles.bannerErrorText}>{error}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={[styles.banner, styles.bannerNotice]}>
            <Text style={styles.bannerNoticeText}>{notice}</Text>
          </View>
        ) : null}

        <View style={[styles.body, style]} {...rest}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** A quiet text link. Used for "already have an account", "back", and so on. */
export function AuthLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={BrandSpace.md}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.linkPressed}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: BrandSpace.xl,
    gap: BrandSpace.xl,
  },
  header: {
    gap: BrandSpace.md,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  subtitle: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
  body: {
    gap: BrandSpace.xl,
  },
  banner: {
    borderRadius: BrandRadius.card,
    paddingHorizontal: BrandSpace.lg,
    paddingVertical: BrandSpace.md,
  },
  bannerError: {
    backgroundColor: BrandColor.roseSoft,
  },
  bannerErrorText: {
    ...BrandType.body,
    color: BrandColor.rose,
  },
  bannerNotice: {
    backgroundColor: BrandColor.spruceSoft,
  },
  bannerNoticeText: {
    ...BrandType.body,
    color: BrandColor.spruce,
  },
  link: {
    ...BrandType.label,
    color: BrandColor.spruce,
    textAlign: 'center',
  },
  linkPressed: {
    opacity: 0.6,
  },
});
