import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/card';
import { BrandBorderWidth, BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import { deleteAccount, exportAccountData } from '@/lib/account';
import { signOut } from '@/lib/auth';

export default function SettingsScreen() {
  const { session } = useAuth();
  const [busy, setBusy] = useState<'export' | 'delete' | 'signout' | null>(null);

  async function handleExport() {
    setBusy('export');
    const result = await exportAccountData();
    setBusy(null);
    if (!result.ok) Alert.alert('Export failed', result.message);
  }

  async function handleSignOut() {
    setBusy('signout');
    const result = await signOut();
    setBusy(null);
    if (!result.ok) Alert.alert('Sign out failed', result.message);
  }

  /**
   * Two taps to delete, and the second one spells out what goes. Apple requires
   * account deletion to be reachable in-app; making it honest rather than
   * buried is the whole point of the product's trust positioning.
   */
  function handleDelete() {
    Alert.alert(
      'Delete your account?',
      'This removes your account and every drink, urge, lesson, and challenge you have logged. It cannot be undone.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Last check',
              'Deleting is permanent. Export your data first if you want a copy.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete permanently',
                  style: 'destructive',
                  onPress: async () => {
                    setBusy('delete');
                    const result = await deleteAccount();
                    setBusy(null);
                    if (!result.ok) Alert.alert('Could not delete', result.message);
                    // On success the session clears and the router returns to sign-in.
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Card flush>
            <View style={styles.identity}>
              <Text style={styles.identityLabel}>Signed in as</Text>
              <Text style={styles.identityValue}>{session?.user.email ?? 'Your account'}</Text>
            </View>
            <Divider />
            <SettingsRow
              label="Export my data"
              caption="Everything you have logged, as a JSON file."
              busy={busy === 'export'}
              disabled={busy !== null}
              onPress={handleExport}
            />
            <Divider />
            <SettingsRow
              label="Sign out"
              busy={busy === 'signout'}
              disabled={busy !== null}
              onPress={handleSignOut}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your week</Text>
          <Card>
            <Text style={styles.pendingTitle}>Limit, drink sizes, reminders</Text>
            <Text style={styles.pendingBody}>Coming in a later step.</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Card flush>
            <SettingsRow
              label="Delete my account"
              caption="Permanent. Removes the account and every row it owns."
              tone="danger"
              busy={busy === 'delete'}
              disabled={busy !== null}
              onPress={handleDelete}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingsRow({
  label,
  caption,
  onPress,
  busy = false,
  disabled = false,
  tone = 'default',
}: {
  label: string;
  caption?: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        (disabled || busy) && styles.rowDisabled,
      ]}>
      <Text style={[styles.rowLabel, tone === 'danger' && styles.rowLabelDanger]}>
        {busy ? 'Working…' : label}
      </Text>
      {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
  content: {
    padding: BrandSpace.xl,
    gap: BrandSpace.xxl,
  },
  title: {
    ...BrandType.display,
    color: BrandColor.ink,
  },
  section: {
    gap: BrandSpace.md,
  },
  sectionLabel: {
    ...BrandType.label,
    color: BrandColor.inkMuted,
  },
  identity: {
    padding: BrandSpace.xl,
    gap: BrandSpace.xs,
  },
  identityLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
  identityValue: {
    ...BrandType.body,
    color: BrandColor.ink,
  },
  divider: {
    height: BrandBorderWidth,
    backgroundColor: BrandColor.line,
  },
  row: {
    paddingHorizontal: BrandSpace.xl,
    paddingVertical: BrandSpace.lg,
    gap: BrandSpace.xs,
    minHeight: 52,
    justifyContent: 'center',
  },
  rowPressed: {
    backgroundColor: BrandColor.spruceSoft,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLabel: {
    ...BrandType.body,
    color: BrandColor.spruce,
  },
  rowLabelDanger: {
    color: BrandColor.rose,
  },
  rowCaption: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
  pendingTitle: {
    ...BrandType.heading,
    color: BrandColor.ink,
    marginBottom: BrandSpace.xs,
  },
  pendingBody: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
});
