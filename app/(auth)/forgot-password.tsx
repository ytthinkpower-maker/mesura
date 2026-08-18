import { router } from 'expo-router';
import { useState } from 'react';

import { AuthLink, AuthScreen } from '@/components/auth-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { CODE_LENGTH, normalizeEmail, sendPasswordResetCode, validateEmail } from '@/lib/auth';

/**
 * Account recovery, step one.
 *
 * This is a headline feature, so it is deliberately the shortest path in the
 * app: one field, one button, a code in your inbox. No deep link to lose, no
 * browser handoff, nothing that can strand a user outside the app.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setFormError(null);
    if (nextEmailError) return;

    setBusy(true);
    const result = await sendPasswordResetCode(email);
    setBusy(false);

    if (!result.ok && result.message) {
      setFormError(result.message);
      return;
    }

    /**
     * We move on whether or not that address has an account. Saying "no such
     * user" would let anyone check who has an account here.
     */
    router.push({
      pathname: '/verify',
      params: { email: normalizeEmail(email), purpose: 'recovery' },
    });
  }

  return (
    <AuthScreen
      title="Get back in"
      subtitle={`Give us the email on your account and we will send a ${CODE_LENGTH}-digit code.`}
      error={formError}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        autoFocus
        inputMode="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="go"
        onSubmitEditing={handleSend}
        editable={!busy}
      />

      <PrimaryButton
        label={busy ? 'Sending…' : 'Send the code'}
        disabled={busy}
        onPress={handleSend}
      />

      <AuthLink label="Back to sign in" onPress={() => router.replace('/sign-in')} />
    </AuthScreen>
  );
}
