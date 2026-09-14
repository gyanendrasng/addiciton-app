/**
 * PostHog client for Qwyt.
 *
 * Loaded via expo-constants so the token is baked at build time through
 * app.config.js → extras, not exposed as a raw EXPO_PUBLIC_ variable.
 *
 * Privacy contract (mirrors analytics.ts):
 *   – No user-written text (notes, reasons, triggers).
 *   – No PII: no email, no name. Identity uses the opaque Better Auth user ID,
 *     and only once progress data is consented to.
 *   – No autocapture, no heatmaps. Session recording only under consent.
 *   – Product analytics are on by default (anonymous, habit-free) and off via
 *     Settings; progress data waits for the onboarding ask. See analytics.ts.
 *   – Never from __DEV__ or a simulator: `posthog` is null there.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import PostHog from 'posthog-react-native';

const projectToken = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;

const isConfigured = Boolean(projectToken);

/**
 * No analytics from development builds or simulators. They are not users, and
 * every screen view and replay they produce is noise in the numbers the real
 * ones are measured by. Release builds on real devices are the only source.
 */
const disabled = __DEV__ || !Device.isDevice;

if (disabled && isConfigured) {
  console.log('[posthog] disabled: development build or simulator');
} else if (!disabled && !isConfigured) {
  console.warn('[posthog] POSTHOG_PROJECT_TOKEN missing — events are silently dropped');
}

/**
 * Shared PostHog instance.
 *
 * Autocapture is OFF entirely — `_layout.tsx` passes `autocapture={false}` to
 * PostHogProvider, and screens are tracked manually through the analytics seam.
 *
 * Session replay is NOT started here. `enableSessionReplay` stays false at
 * construction and `analytics.ts` calls `startSessionRecording()` the moment
 * progress consent is in (and `stopSessionRecording()` when it goes) — the
 * lazy start ignores the construction flag, so nothing is recorded before the
 * answer. Replay is the one part of the privacy contract that has to be
 * enforced by construction rather than by discipline: React Native replay
 * captures **full screenshots** — native iOS and Android default to wireframes,
 * React Native does not — so anything drawn on screen is in the recording
 * unless something masks it.
 *
 * `maskAllTextInputs` is OFF, and that is deliberate. Despite the name, the
 * iOS SDK applies it to every React Native `<Text>` — `RCTTextView` and
 * `RCTParagraphComponentView` are treated as text inputs
 * (PostHogReplayIntegration.swift, `maskAllTextInputs == true` branches) — so
 * with it on, every recording was a screen of black boxes and useless. Masking
 * is done by hand instead: every `TextInput` that takes prose or personal
 * data, and every `Text` that renders something the user wrote, is wrapped in
 * `PostHogMaskView`. Today: the check-in note, the relapse note and trigger,
 * the reason editor and list (Reasons screen and step 3 of the urge flow), the
 * account display name, and the sign-in email and code.
 *
 * Rule 1 of `analytics.ts` depends on this, and so does the sentence the
 * onboarding consent screen puts in front of people: "Never what you write".
 * Add a screen that renders user text without masking it and that sentence
 * silently becomes a lie.
 */
export const posthog = isConfigured && !disabled
  ? new PostHog(projectToken as string, {
      host: host ?? 'https://us.i.posthog.com',
      /**
       * Opted in at construction: product analytics are on by default, and
       * what goes out before any consent is anonymous and habit-free —
       * lifecycle events and the tier-1 events in `analytics.ts`. Nothing
       * sensitive can leave until `setAnalyticsConsent('in')`, because the
       * seam holds tier 2, the identity and the recording behind it. The
       * Settings switch turns the whole client off via `optOut()`.
       */
      defaultOptIn: true,
      // Off here; started by consent. See the header.
      enableSessionReplay: false,
      sessionReplayConfig: {
        // OFF — on React Native this masks every <Text>, not just inputs; see
        // the header. User-written text is masked per view with PostHogMaskView.
        maskAllTextInputs: false,
        // Default true, stated explicitly because the privacy contract rests on
        // it and a silent upstream default change would break it.
        maskAllImages: true,
        // Android only. Logs are a side channel nobody audits for user content,
        // so they stay out of the recording.
        captureLog: false,
        // iOS only, and metrics only — no request or response bodies.
        captureNetworkTelemetry: true,
        throttleDelayMs: 1000,
      },
      // Lifecycle events (install / update / open / background) carry no PII
      // and are product analytics; the Settings switch suppresses them.
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
