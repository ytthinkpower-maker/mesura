import { useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AuthScreen } from '@/components/auth-screen';
import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { setNewPassword, validatePassword } from '@/lib/auth';

/**
 * Account recovery, final step. Reached only with a verified recovery session,
 * and the router keeps the user here until the password is actually saved.
 */
export default function NewPasswordScreen() {
  const { endPasswordRecovery } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const nextPasswordError = validatePassword(password);
    const nextConfirmationError = password === confirmation ? null : 'Those two do not match.';
    setPasswordError(nextPasswordError);
    setConfirmationError(nextConfirmationError);
    setFormError(null);
    if (nextPasswordError || nextConfirmationError) return;

    setBusy(true);
    const result = await setNewPassword(password);
    setBusy(false);

    if (!result.ok) {
      if (result.message) setFormError(result.message);
      return;
    }

    /** Recovery is over. The router now lets the session through to the app. */
    endPasswordRecovery();
  }

  return (
    <AuthScreen
      title="Pick a new password"
      subtitle="Then you are straight back in. Nothing was lost."
      error={formError}>
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        autoCapitalize="none"
        autoComplete="new-password"
        autoFocus
        revealable
        textContentType="newPassword"
        returnKeyType="next"
        editable={!busy}
      />

      <TextField
        label="New password again"
        value={confirmation}
        onChangeText={setConfirmation}
        error={confirmationError}
        autoCapitalize="none"
        autoComplete="new-password"
        revealable
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSave}
        editable={!busy}
      />

      <PrimaryButton
        label={busy ? 'Saving…' : 'Save and continue'}
        disabled={busy}
        onPress={handleSave}
      />
    </AuthScreen>
  );
}
