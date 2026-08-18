import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthLink, AuthScreen } from '@/components/auth-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { BrandColor, BrandSpace, BrandType } from '@/constants/brand';
import { normalizeEmail, signUpWithEmail, validateEmail, validatePassword } from '@/lib/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);
    if (nextEmailError || nextPasswordError) return;

    setBusy(true);
    const result = await signUpWithEmail(email, password);
    setBusy(false);

    if (!result.ok) {
      if (result.message) setFormError(result.message);
      return;
    }

    if (result.needsVerification) {
      router.push({
        pathname: '/verify',
        params: { email: normalizeEmail(email), purpose: 'signup' },
      });
    }
    // Otherwise the session already exists and the root layout takes over.
  }

  return (
    <AuthScreen
      title="Set your first week"
      subtitle="An email and a password. That is the whole sign-up."
      error={formError}>
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
        autoComplete="new-password"
        revealable
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        editable={!busy}
      />

      <PrimaryButton
        label={busy ? 'Creating your account…' : 'Create account'}
        disabled={busy}
        onPress={handleSignUp}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <AuthLink label="Sign in" onPress={() => router.replace('/sign-in')} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: BrandSpace.sm,
    alignItems: 'center',
  },
  footerText: {
    ...BrandType.body,
    color: BrandColor.inkMuted,
  },
});
