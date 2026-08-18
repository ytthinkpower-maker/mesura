import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/card';
import { BrandBorderWidth, BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import { deleteAccount, exportAccountData } from '@/lib/account';
import { signOut } from '@/lib/auth';
import { DEV_MENU_ENABLED, DEV_MENU_TAPS } from '@/lib/dev';
import { REMINDER_HOUR, setEveningReminder } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { session } = useAuth();
  const [busy, setBusy] = useState<'export' | 'delete' | 'signout' | null>(null);
  const [reminder, setReminder] = useState<boolean | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);

  const loadReminder = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('evening_reminder')
      .eq('id', session.user.id)
      .single();

    setReminder(data?.evening_reminder ?? true);
  }, [session?.user.id]);

  // Re-read on every focus rather than once on mount. The switch is the only
  // control for the nudge, so a screen that reads it once and then gets stuck
  // is a reminder nobody can turn off.
  useFocusEffect(
    useCallback(() => {
      void loadReminder();
    }, [loadReminder])
  );

  /**
   * The switch moves first and rolls back on failure. A toggle that waits for a
   * round trip reads as broken, and this one is genuinely reversible.
   */
  async function handleReminder(next: boolean) {
    const previous = reminder;
    setReminder(next);
    setSavingReminder(true);

    const result = await setEveningReminder(next);
    setSavingReminder(false);

    if (!result.ok) {
      setReminder(previous);
      Alert.alert('Not saved', result.message);
      return;
    }

    if (next && result.state === 'denied') {
      Alert.alert(
        'Notifications are off for Mesura',
        'Turn them on in iOS Settings and the evening check-in will start arriving.'
      );
    }
  }

  /**
   * Ten taps on the version number opens the developer menu. The counter is a
   * ref rather than state so that tapping nine times and stopping leaves no
   * trace and re-renders nothing.
   */
  const versionTaps = useRef(0);

  function handleVersionTap() {
    if (!DEV_MENU_ENABLED) return;

    versionTaps.current += 1;
    if (versionTaps.current < DEV_MENU_TAPS) return;

    versionTaps.current = 0;
    router.push('/dev-menu');
  }

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
          <Text style={styles.sectionLabel}>Evening check-in</Text>
          <Card flush>
            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Remind me at {REMINDER_HOUR}:00</Text>
                <Text style={styles.rowCaption}>
                  {reminder === null
                    ? 'Checking…'
                    : 'One tap to close the day. The only thing Mesura ever sends you.'}
                </Text>
              </View>
              {/*
                Until the profile has been read the switch shows the column's
                own default rather than `false`. Showing "off" for a preference
                that is on — while disabled, so it cannot be corrected — is how
                a nightly notification becomes one the user has no way to stop.
              */}
              <Switch
                value={reminder ?? true}
                disabled={reminder === null || savingReminder}
                onValueChange={(next) => void handleReminder(next)}
                trackColor={{ false: BrandColor.line, true: BrandColor.spruce }}
                ios_backgroundColor={BrandColor.line}
                accessibilityLabel={`Evening check-in at ${REMINDER_HOUR}:00`}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your week</Text>
          <Card>
            <Text style={styles.pendingTitle}>Limit and drink sizes</Text>
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

        <Pressable
          accessibilityRole="text"
          accessibilityLabel={`Mesura version ${APP_VERSION}`}
          onPress={handleVersionTap}
          style={styles.version}>
          <Text style={styles.versionLabel}>Mesura {APP_VERSION}</Text>
        </Pressable>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandSpace.lg,
    paddingHorizontal: BrandSpace.xl,
    paddingVertical: BrandSpace.lg,
    minHeight: 52,
  },
  switchText: {
    flex: 1,
    gap: BrandSpace.xs,
  },
  switchLabel: {
    ...BrandType.body,
    color: BrandColor.ink,
  },
  version: {
    alignItems: 'center',
    paddingVertical: BrandSpace.lg,
  },
  versionLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
});
