import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthLink, AuthScreen } from '@/components/auth-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { BrandColor, BrandRadius, BrandSpace, BrandType } from '@/constants/brand';
import {
  isAppleSignInAvailable,
  signInWithApple,
  signInWithEmail,
  validateEmail,
} from '@/lib/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    void isAppleSignInAvailable().then((available) => {
      if (active) setAppleAvailable(available);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSignIn() {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? null : 'Enter your password.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);
    if (nextEmailError || nextPasswordError) return;

    setBusy(true);
    const result = await signInWithEmail(email, password);
    setBusy(false);

    if (!result.ok && result.message) setFormError(result.message);
    // On success the root layout sees the new session and swaps to the tabs.
  }

  async function handleApple() {
    setFormError(null);
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);
    if (!result.ok && result.message) setFormError(result.message);
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Your week is where you left it." error={formError}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        inputMode="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        editable={!busy}
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        autoCapitalize="none"
        autoComplete="current-password"
        revealable
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
        editable={!busy}
      />

      <PrimaryButton
        label={busy ? 'Signing in…' : 'Sign in'}
        disabled={busy}
        onPress={handleSignIn}
      />

      <AuthLink label="Forgot your password?" onPress={() => router.push('/forgot-password')} />

      {appleAvailable ? (
        <View style={styles.appleBlock}>
          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.rule} />
          </View>

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={BrandRadius.pill}
            style={styles.appleButton}
            onPress={handleApple}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>New here?</Text>
        <AuthLink label="Create an account" onPress={() => router.replace('/sign-up')} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  appleBlock: {
    gap: BrandSpace.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BrandSpace.md,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColor.line,
  },
  dividerLabel: {
    ...BrandType.caption,
    color: BrandColor.inkMuted,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  footer: {
    gap: BrandSpace.sm,
    alignItems: 'center',
  },
  footerText: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
});
