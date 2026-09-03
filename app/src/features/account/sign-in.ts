/**
 * Sign-in flows.
 *
 *  iOS      → Sign in with Apple (native sheet) + Google + email code
 *  Android  → Google + email code
 *
 * Apple requires Sign in with Apple wherever another social login is offered on
 * their platforms, which is why it is iOS-only and always listed first there.
 *
 * Apple uses the NATIVE flow: expo-apple-authentication returns an identity
 * token that we hand to Better Auth, so there's no browser detour. Google uses
 * Better Auth's browser flow, which needs no extra native module.
 *
 * Email code exists because it is the only method that behaves identically on
 * both platforms: someone who subscribed on an iPhone with Sign in with Apple
 * and later moves to Android has no other way back into the same account, and
 * with recovery data on-device, being locked out of the entitlement is the exact
 * failure accounts were added to prevent.
 *
 * NOTE: callers must `refreshSession()` after a successful sign-in rather than
 * waiting for a re-render — see `@/lib/session`.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { track } from '@/lib/analytics';
import { authClient } from '@/lib/auth-client';

export type Provider = 'apple' | 'google' | 'email';

export type SignInResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled?: false; message: string };

/** Which providers to show on this platform, in order. */
export function availableProviders(): Provider[] {
  return Platform.OS === 'ios' ? ['apple', 'google', 'email'] : ['google', 'email'];
}

export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

async function signInWithApple(): Promise<SignInResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { ok: false, message: 'Apple did not return an identity token.' };
    }
    const { error } = await authClient.signIn.social({
      provider: 'apple',
      idToken: {
        token: credential.identityToken,
        // Apple sends name/email ONLY on the first authorization and offers no
        // user-info endpoint to recover them, so pass them through when
        // present. On re-authorization they are absent and the server falls
        // back to the `sub` claim (see website/src/lib/auth.ts).
        user: {
          email: credential.email ?? undefined,
          name: credential.fullName
            ? {
                firstName: credential.fullName.givenName ?? undefined,
                lastName: credential.fullName.familyName ?? undefined,
              }
            : undefined,
        },
      },
    });
    if (error) return { ok: false, message: error.message ?? 'Sign in failed.' };
    track('signin_completed', { provider: 'apple' });
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'ERR_REQUEST_CANCELED') return { ok: false, cancelled: true };
    return { ok: false, message: err.message ?? 'Sign in failed.' };
  }
}

async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'curb://',
    });
    if (error) return { ok: false, message: error.message ?? 'Sign in failed.' };
    track('signin_completed', { provider: 'google' });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message ?? 'Sign in failed.' };
  }
}

/** Step 1 of the email flow — mails a 6-digit code. */
export async function sendEmailCode(email: string): Promise<SignInResult> {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { ok: false, message: 'That doesn’t look like an email address.' };
  }
  try {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: address,
      type: 'sign-in',
    });
    if (error) return { ok: false, message: error.message ?? 'Could not send the code.' };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message ?? 'Could not send the code.' };
  }
}

/** Step 2 of the email flow — exchanges the code for a session. */
export async function verifyEmailCode(email: string, code: string): Promise<SignInResult> {
  try {
    const { error } = await authClient.signIn.emailOtp({
      email: email.trim().toLowerCase(),
      otp: code.trim(),
    });
    if (error) return { ok: false, message: error.message ?? 'That code didn’t work.' };
    track('signin_completed', { provider: 'email' });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message ?? 'That code didn’t work.' };
  }
}

export function signInWith(provider: Exclude<Provider, 'email'>): Promise<SignInResult> {
  return provider === 'apple' ? signInWithApple() : signInWithGoogle();
}

export async function signOutEverywhere() {
  await authClient.signOut();
}
