/**
 * Better Auth client for Curb.
 *
 * Accounts exist only to sync premium across devices — no recovery data is ever
 * sent. The session token lives in the OS keychain (expo-secure-store), not in
 * AsyncStorage.
 */
import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

/** Where the Next.js app (website/) is deployed. */
export const AUTH_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_URL ?? 'https://joincurb.app';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'curb',
      storagePrefix: 'curb',
      storage: SecureStore,
    }),
    // Email code is the only sign-in that works identically on iOS and
    // Android — it is how someone who bought on iPhone with Apple ID gets
    // their premium back on an Android phone.
    emailOTPClient(),
  ],
});

/**
 * NOTE: `useSession` is deliberately NOT re-exported. The reactive hook is
 * broken on Expo SDK 57 / RN 0.86 (better-auth #10545) — import `useSession`
 * from `@/lib/session` instead, which drives off `getSession()`.
 */
export const { signIn, signOut, getSession } = authClient;
