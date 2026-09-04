import { randomUUID } from 'node:crypto';

import { betterAuth } from 'better-auth';
import { expo } from '@better-auth/expo';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';

import { drizzleAdapter } from '@better-auth/drizzle-adapter';

import { db, schema } from '../db';
import { sendSignInCode } from './mail';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Curb auth.
 *
 * Accounts exist for ONE reason: syncing premium entitlements across a user's
 * devices.
 *
 * Providers: Sign in with Apple (iOS) + Google (iOS and Android) + a six-digit
 * email code. Apple requires Sign in with Apple to be offered wherever another
 * social login is, on their platforms. Email is there because it is the only
 * method that behaves the same on both platforms — without it, someone who
 * subscribed on iPhone with their Apple ID has no way back into that account
 * from an Android phone, which is exactly the lockout accounts were added to
 * prevent.
 */
export const auth = betterAuth({
  appName: 'Curb',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'https://joincurb.app',

  // No email/password — social + email code only, so there are no passwords
  // to leak and no scrypt hashing on cold starts.
  emailAndPassword: { enabled: false },

  socialProviders: {
    apple: {
      /**
       * Curb only ever uses Apple's NATIVE flow: expo-apple-authentication
       * hands us an identity token and Better Auth verifies it. That path
       * checks `idToken.audience`, which prefers `appBundleIdentifier` over
       * `clientId` — so the bundle id below is the value that actually
       * matters.
       *
       * `clientSecret` is deliberately absent. It is only read by
       * createAuthorizationURL and validateAuthorizationCode, i.e. the web
       * redirect flow, which we don't offer: Apple sign-in is iOS-only here
       * and the website has no Apple button. Leaving it out also drops the
       * six-monthly chore of regenerating Apple's client-secret JWT.
       *
       * `clientId` stays because the type requires it; it is never consulted
       * while `appBundleIdentifier` is set. If Apple sign-in is ever added on
       * the web, both it and a real `clientSecret` become required.
       */
      clientId: process.env.APPLE_CLIENT_ID ?? process.env.APPLE_BUNDLE_ID ?? 'app.joincurb.curb',
      appBundleIdentifier: process.env.APPLE_BUNDLE_ID ?? 'app.joincurb.curb',
      /**
       * Apple releases the `email` claim only on the FIRST authorization and
       * offers no user-info endpoint to recover it. Without a fallback, every
       * re-authorizing user hits `email_not_found`. `sub` is stable per
       * (user, app), so it makes a usable placeholder; the address is never
       * mailed, and a real one arrives if they later use the email code.
       */
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.sub}@privaterelay.appleid.com`,
        emailVerified: !!profile.email_verified,
      }),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  user: {
    // Apple 5.1.1(v): once accounts exist, in-app deletion is mandatory.
    deleteUser: { enabled: true },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 90, // 90 days — a habit app is opened daily
    updateAge: 60 * 60 * 24, // refresh at most once a day
    /**
     * `cookieCache` is deliberately OFF. The Expo client chunks any cookie jar
     * over 1800 bytes across `<key>.0..N` SecureStore keys and clears the base
     * key first, so a cold-start read racing a write sees "" and the request
     * goes out unauthenticated — silent 401s. With cookieCache on, a bare user
     * payload is already ~1750 bytes, straight into that path. Fixed upstream
     * in PR #11099 but unreleased as of 1.7.2; re-evaluate on 1.7.3+.
     * Without it we pay one Postgres roundtrip per session read, which `joins`
     * below cuts back down.
     */
  },

  advanced: {
    database: {
      /**
       * UUIDv4 rather than Better Auth's base62 default. Both satisfy every
       * hard RevenueCat App-User-ID constraint, but RevenueCat's
       * "track new purchases from server-to-server notifications" requires an
       * RFC 4122 v4 id so it can match `appAccountToken` /
       * `obfuscatedExternalAccountId`. Re-keying user ids after launch is a
       * migration worth avoiding, and this costs nothing now.
       * The function form is used because `generateId: 'uuid'` is not
       * documented to emit v4 specifically; `randomUUID()` is v4 by spec.
       */
      generateId: () => randomUUID(),
      // Single-query session reads — recovers most of the cost of having
      // `cookieCache` off (see above).
      joins: true,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },

  trustedOrigins: [
    'curb://',
    'https://joincurb.app',
    // Expo Go serves the app from exp://<lan-ip>:<port>, which changes with
    // the network — the docs' wildcards are the only workable dev entry.
    ...(isProd
      ? []
      : [
          'exp://',
          'exp://**',
          'exp://192.168.*.*:*/**',
          'http://localhost:3000',
          'http://localhost:8090',
        ]),
  ],

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 5, // 5 minutes
      allowedAttempts: 3,
      // Codes are short-lived, but a leaked database dump shouldn't hand
      // anyone a live sign-in code either.
      storeOTP: 'hashed',
      // First sign-in with a code creates the account — there is no separate
      // sign-up step in the app.
      disableSignUp: false,
      sendVerificationOTP: async ({ email, otp }) => {
        await sendSignInCode(email, otp);
      },
    }),
    // `expo()` adds the native deep-link origins and the authorization proxy.
    // `nextCookies()` must be last so it can write Set-Cookie on server actions.
    expo(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
