/**
 * PostHog client for Curb.
 *
 * Loaded via expo-constants so the token is baked at build time through
 * app.config.js → extras, not exposed as a raw EXPO_PUBLIC_ variable.
 *
 * Privacy contract (mirrors analytics.ts):
 *   – No user-written text (notes, reasons, triggers).
 *   – No PII: no email, no name. Identity uses the opaque Better Auth user ID.
 *   – No autocapture, no session recording, no heatmaps.
 *   – Opt-in: analytics.ts defaults optedOut=true; the provider is only wired
 *     in once the user enables analytics in Settings.
 */
import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

const projectToken = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;

const isConfigured = Boolean(projectToken);

if (__DEV__ && !isConfigured) {
  console.error(
    'POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, ' +
      'this causes events to be silently missed. ' +
      'This error stops appearing once POSTHOG_PROJECT_TOKEN is configured',
  );
}

/**
 * Shared PostHog instance.
 *
 * Autocapture is OFF entirely — `_layout.tsx` passes `autocapture={false}` to
 * PostHogProvider, and screens are tracked manually through the analytics seam.
 * That matches rule 3 of the privacy contract in `analytics.ts`; session
 * recording and heatmaps are likewise never enabled.
 */
export const posthog = isConfigured
  ? new PostHog(projectToken as string, {
      host: host ?? 'https://us.i.posthog.com',
      // Lifecycle events (install / update / open / background) are fine —
      // they carry no PII.
      captureAppLifecycleEvents: true,
      flushAt: 20,
      flushInterval: 10_000,
      maxBatchSize: 100,
      maxQueueSize: 1_000,
      preloadFeatureFlags: false,
      requestTimeout: 10_000,
      fetchRetryCount: 3,
      fetchRetryDelay: 3_000,
    })
  : null;
