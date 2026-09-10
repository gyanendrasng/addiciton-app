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
 *
 * Session replay IS on, and it is the one part of the privacy contract that has
 * to be enforced by construction rather than by discipline. React Native replay
 * captures **full screenshots** — native iOS and Android default to wireframes,
 * React Native does not — so anything drawn on screen is in the recording
 * unless something masks it.
 *
 * `maskAllTextInputs` covers every `TextInput`, which is where the check-in
 * note, the relapse note and the reason editor live. Rendered `Text` is *not*
 * covered, so any view that draws something the user wrote must be wrapped in
 * `PostHogMaskView`. Today that is `ReasonsList` (used by both the Reasons
 * screen and step 3 of the urge flow) and the account name.
 *
 * Rule 1 of `analytics.ts` depends on this, and so does the sentence the
 * onboarding consent screen puts in front of people: "Never what you write".
 * Add a screen that renders user text without masking it and that sentence
 * silently becomes a lie.
 */
export const posthog = isConfigured
  ? new PostHog(projectToken as string, {
      host: host ?? 'https://us.i.posthog.com',
      /**
       * Start opted OUT, at construction.
       *
       * `analytics.ts` also calls `optOut()`, but that runs *after* the client
       * is built, and lifecycle capture is enabled — so an app-open event can
       * race the opt-out and reach PostHog before anyone consented. Play's User
       * Data policy requires consent "before your app can begin to collect or
       * access the personal and sensitive user data", and which habits someone
       * is quitting is health data. `defaultOptIn: false` closes the window.
       */
      defaultOptIn: false,
      enableSessionReplay: true,
      sessionReplayConfig: {
        // Both default to true; stated explicitly because the privacy contract
        // rests on them and a silent upstream default change would break it.
        maskAllTextInputs: true,
        maskAllImages: true,
        // Android only. Logs are a side channel nobody audits for user content,
        // so they stay out of the recording.
        captureLog: false,
        // iOS only, and metrics only — no request or response bodies.
        captureNetworkTelemetry: true,
        throttleDelayMs: 1000,
      },
      // Lifecycle events (install / update / open / background) carry no PII,
      // and are suppressed entirely until the user opts in.
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
