import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from '@/lib/supabase';

/**
 * Every auth call returns this shape rather than throwing. Screens render
 * `message` verbatim, so the copy lives here — plain, warm, never clinical, and
 * never blaming the user for a typo.
 */
export type AuthResult =
  | { ok: true; cancelled?: false }
  | { ok: false; cancelled: true; message?: undefined }
  | { ok: false; cancelled?: false; message: string };

/** Sign-up either signs you straight in, or needs a code from your inbox. */
export type SignUpResult = AuthResult & { needsVerification?: boolean };

export type VerificationPurpose = 'signup' | 'recovery';

/** Mirrors "Minimum password length" on the Supabase Email provider. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Mirrors "Email OTP length" on the Supabase Email provider. Change one and you
 * must change the other: the verify screen refuses to submit at any other
 * length, so a mismatch makes every valid code look wrong.
 */
export const CODE_LENGTH = 8;

/**
 * Patterns checked against the real messages Supabase returns, in order. Verified
 * against the live API rather than guessed — an unmatched pattern silently
 * downgrades good copy to the generic fallback.
 */
const FRIENDLY_ERRORS: { match: RegExp; message: string }[] = [
  {
    match: /invalid login credentials/i,
    message: 'That email and password do not match. Try again, or reset your password.',
  },
  {
    match: /email not confirmed/i,
    message: 'Confirm your email first — check your inbox for the code we sent.',
  },
  {
    match: /user already registered|already been registered/i,
    message: 'There is already an account with that email. Sign in instead.',
  },
  {
    /**
     * Supabase returns one message — "Token has expired or is invalid" — for
     * both a mistyped code and a stale one, so the copy has to cover both.
     * Telling a user their code expired when they simply fat-fingered it sends
     * them to request a new email they do not need.
     */
    match: /token has expired|expired|invalid token|otp_expired/i,
    message: 'That code is wrong or has expired. Check the email, or send a new code.',
  },
  {
    match: /(invalid|incorrect).*(otp|code)/i,
    message: 'That code is not right. Check the email and try again.',
  },
  {
    match: /password should be at least|weak.?password/i,
    message: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
  },
  {
    match: /rate limit|too many requests|for security purposes/i,
    message: 'Too many tries just now. Wait a minute and try again.',
  },
  {
    match: /network|fetch failed|timeout/i,
    message: 'Could not reach the server. Check your connection and try again.',
  },
  {
    match: /new password should be different/i,
    message: 'Pick a password you have not used on this account before.',
  },
];

function friendly(error: { message: string } | null, fallback: string): string {
  if (!error) return fallback;
  const known = FRIENDLY_ERRORS.find((candidate) => candidate.match.test(error.message));
  return known ? known.message : fallback;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return 'That does not look like an email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
  });

  if (error) return { ok: false, message: friendly(error, 'Could not create that account.') };

  /**
   * With "Confirm email" on, Supabase returns a user but no session — the
   * account is not usable until the emailed code is verified.
   */
  return { ok: true, needsVerification: data.session === null };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  if (error) return { ok: false, message: friendly(error, 'Could not sign you in.') };
  return { ok: true };
}

/**
 * Sends a one-time code to the address, if an account exists. Supabase does
 * not reveal whether it did, and neither do we — the screen says the same thing
 * either way so an attacker cannot use this to discover who has an account.
 */
export async function sendPasswordResetCode(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) return { ok: false, message: friendly(error, 'Could not send that email.') };
  return { ok: true };
}

/** Re-sends the sign-up confirmation code. */
export async function resendSignUpCode(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: normalizeEmail(email) });
  if (error) return { ok: false, message: friendly(error, 'Could not send that email.') };
  return { ok: true };
}

/**
 * Exchanges an emailed code for a session. For `recovery` this signs the user
 * in far enough to set a new password, and nothing more — the caller is
 * responsible for sending them to the new-password screen.
 */
export async function verifyEmailCode(
  email: string,
  code: string,
  purpose: VerificationPurpose
): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: code.trim(),
    type: purpose === 'signup' ? 'signup' : 'recovery',
  });

  if (error) return { ok: false, message: friendly(error, 'Could not check that code.') };
  return { ok: true };
}

export async function setNewPassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: friendly(error, 'Could not save that password.') };
  return { ok: true };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, message: friendly(error, 'Could not sign you out.') };
  return { ok: true };
}

/** Apple's button is only worth showing where the device can actually do it. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Sign in with Apple.
 *
 * Apple returns an identity token, which Supabase trades for a session. Note
 * that Apple only ever sends the name and email on the *first* authorization
 * for a given app — so in Expo Go, where the bundle id is Expo Go's own, the
 * values differ from a real build. That is expected and documented by Expo.
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { ok: false, message: 'Apple did not return a sign-in token. Try again.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) return { ok: false, message: friendly(error, 'Could not sign you in with Apple.') };
    return { ok: true };
  } catch (caught) {
    const code = (caught as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED') {
      return { ok: false, cancelled: true };
    }
    return { ok: false, message: 'Could not sign you in with Apple.' };
  }
}
