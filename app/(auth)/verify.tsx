import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/components/auth-provider';
import { AuthLink, AuthScreen } from '@/components/auth-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { BrandType } from '@/constants/brand';
import {
  CODE_LENGTH,
  resendSignUpCode,
  sendPasswordResetCode,
  verifyEmailCode,
  type VerificationPurpose,
} from '@/lib/auth';

/**
 * Code entry, for both "confirm your new account" and "reset your password".
 *
 * Codes rather than emailed links: a link has to travel from Mail back into the
 * app through a deep link, which is the single most common way a recovery flow
 * strands someone. A code cannot get lost between apps.
 */
export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string; purpose?: string }>();
  const email = params.email ?? '';
  const purpose: VerificationPurpose = params.purpose === 'recovery' ? 'recovery' : 'signup';
  const { beginPasswordRecovery } = useAuth();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * This screen is meaningless without the address the code went to — there
   * would be nothing to verify the code against. Reaching it with no email means
   * something sent the user here by mistake, so send them somewhere useful.
   */
  if (!email) return <Redirect href="/sign-in" />;

  async function handleVerify() {
    if (code.trim().length !== CODE_LENGTH) {
      setCodeError(`The code is ${CODE_LENGTH} digits.`);
      return;
    }
    setCodeError(null);
    setFormError(null);
    setNotice(null);

    /**
     * Flagged before the call, not after: verifying a recovery code creates a
     * real session, and without this flag the router would drop the user into
     * the app with their old password still set.
     */
    if (purpose === 'recovery') beginPasswordRecovery();

    setBusy(true);
    const result = await verifyEmailCode(email, code, purpose);
    setBusy(false);

    if (!result.ok) {
      if (result.message) setFormError(result.message);
      return;
    }

    if (purpose === 'recovery') router.replace('/new-password');
    // For sign-up the session now exists and the root layout takes over.
  }

  async function handleResend() {
    setFormError(null);
    setNotice(null);
    setBusy(true);
    const result =
      purpose === 'recovery' ? await sendPasswordResetCode(email) : await resendSignUpCode(email);
    setBusy(false);

    if (!result.ok && result.message) setFormError(result.message);
    else setNotice('Sent. Give it a moment to arrive.');
  }

  return (
    <AuthScreen
      title="Check your email"
      subtitle={`We sent a ${CODE_LENGTH}-digit code to ${email}.`}
      error={formError}
      notice={notice}>
      <TextField
        label="Code"
        value={code}
        onChangeText={(next) => setCode(next.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        error={codeError}
        autoFocus
        inputMode="numeric"
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        returnKeyType="go"
        onSubmitEditing={handleVerify}
        editable={!busy}
        inputStyle={styles.code}
      />

      <PrimaryButton
        label={busy ? 'Checking…' : 'Continue'}
        disabled={busy}
        onPress={handleVerify}
      />

      <AuthLink label="Send a new code" onPress={handleResend} />
      <AuthLink label="Back to sign in" onPress={() => router.replace('/sign-in')} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  code: {
    ...BrandType.title,
    /** Same reason as the base input style: lineHeight clips glyphs on iOS. */
    lineHeight: undefined,
    letterSpacing: 8,
  },
});
