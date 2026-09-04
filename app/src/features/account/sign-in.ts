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
 * with everything you've written held on the device, being locked out of the
 * entitlement is the exact failure accounts were added to prevent.
 *
 * NOTE: callers must `refreshSession()` after a successful sign-in rather than
 * waiting for a re-render — see `@/lib/session`.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { setPremium } from '@/db/repo/profile';
import { setSetting } from '@/db/repo/settings';
import { DEV_SKIP_AUTH_KEY } from '@/features/settings/dev';
import { track } from '@/lib/analytics';
import { authClient } from '@/lib/auth-client';
import { humanError } from '@/lib/errors';

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
      return { ok: false, message: 'Apple didn’t return a sign-in token. Please try again.' };
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
    if (error) return { ok: false, message: humanError(error, 'signin') };
    track('signin_completed', { provider: 'apple' });
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'ERR_REQUEST_CANCELED') return { ok: false, cancelled: true };
    /**
     * The common cause of a failed Apple sign-in is no Apple ID on the device
     * — including on the Simulator, where signing in under Settings makes it
     * work. "Please try again" doesn't help anyone diagnose that.
     */
    if (!(await isAppleAvailable())) {
      return {
        ok: false,
        message: 'Sign in with Apple needs an Apple ID signed in on this device.',
      };
    }
    return { ok: false, message: humanError(err, 'signin') };
  }
}

async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'curb://',
    });
    if (error) return { ok: false, message: humanError(error, 'signin') };
    track('signin_completed', { provider: 'google' });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: humanError(e, 'signin') };
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
    if (error) return { ok: false, message: humanError(error, 'code') };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: humanError(e, 'code') };
  }
}

/** Step 2 of the email flow — exchanges the code for a session. */
export async function verifyEmailCode(email: string, code: string): Promise<SignInResult> {
  try {
    const { error } = await authClient.signIn.emailOtp({
      email: email.trim().toLowerCase(),
      otp: code.trim(),
    });
    if (error) {
      // Wrong or expired codes are the common case and deserve their own line.
      const raw = (error.message ?? '').toLowerCase();
      if (raw.includes('invalid') || raw.includes('expired') || raw.includes('otp')) {
        return { ok: false, message: 'That code didn’t work. Check it, or send a new one.' };
      }
      return { ok: false, message: humanError(error, 'signin') };
    }
    track('signin_completed', { provider: 'email' });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: humanError(e, 'signin') };
  }
}

export function signInWith(provider: Exclude<Provider, 'email'>): Promise<SignInResult> {
  return provider === 'apple' ? signInWithApple() : signInWithGoogle();
}

/**
 * Sign out, for real.
 *
 * The entitlement belongs to the account, so signing out has to drop the local
 * premium mirror as well — otherwise "Sign out" is cosmetic: the session ends,
 * the gate keeps seeing `premium: true` from SQLite, and the app stays unlocked
 * forever. Clearing it puts the user back at the wall, where signing in again
 * restores their subscription.
 *
 * On-device recovery data is untouched. It is never keyed to an account.
 */
export async function signOutEverywhere() {
  try {
    await authClient.signOut();
  } catch {
    // A failed network call must not strand a session locally — the local
    // state below is what the gate reads, so clear it regardless.
  }
  await setPremium(false);
  if (__DEV__) await setSetting(DEV_SKIP_AUTH_KEY, false);
}
