/**
 * Analytics seam.
 *
 * Nothing is sent anywhere today — every call is a no-op. This exists so that
 * adding a provider later (PostHog is the plan) is a one-file change instead of
 * touching every screen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RULES — these are not style preferences, they protect the app's privacy claim
 * and its store filings:
 *
 * 1. NEVER send anything the user WROTE. No journal text, no reasons, no
 *    relapse or check-in notes, no free-text triggers. Not truncated, not
 *    hashed, not "just the first few words". This is the line the privacy
 *    policy draws and the one the app is sold on.
 * 2. Structured progress data IS sent: which habits are tracked, streak
 *    lengths, slip and urge counts, milestones. Disclosed in /privacy §3c as
 *    sensitive personal information, and switchable off in Settings.
 * 3. No session recording, no autocapture, no heatmaps.
 * 4. Anonymous device-scoped id only. Never the user's email.
 * 5. Honour `optedOut` — it is user-facing in Settings and defaults to OFF
 *    (i.e. analytics disabled) until the user opts in.
 *
 * Turning this on changes the app's privacy posture. Before shipping a provider:
 *   - /privacy §3c already describes PostHog and what it receives; keep the
 *     code and that section in agreement, in both directions
 *   - update Apple's App Privacy answers (Usage Data)
 *   - update Google Play's Data safety form
 * A mismatch between those and the shipped app is the top policy-takedown risk.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Interaction events. Keep this list closed — no free-form event names. */
export type AnalyticsEvent =
  // onboarding funnel
  | 'onboarding_started'
  | 'onboarding_quiz_completed'
  | 'onboarding_completed'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'purchase_started'
  | 'purchase_completed'
  // daily loop
  | 'pledge_made'
  | 'checkin_saved'
  // urge toolkit
  | 'urge_started'
  | 'urge_step_completed'
  | 'urge_survived'
  | 'urge_slipped'
  | 'urge_abandoned'
  | 'game_played'
  // recovery
  | 'relapse_logged'
  | 'relapse_undone'
  | 'milestone_reached'
  // accounts
  | 'signup_completed'
  | 'signin_completed'
  | 'account_deleted';

/** Only primitives, and only non-identifying ones. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

type Provider = {
  capture: (event: AnalyticsEvent, props?: AnalyticsProps) => void;
  identify: (anonymousId: string, props?: AnalyticsProps) => void;
  reset: () => void;
};

let provider: Provider | null = null;
let optedOut = true; // privacy-first default: nothing until the user opts in

/** Wire a provider in (e.g. PostHog). Called once at startup, if enabled. */
export function setAnalyticsProvider(p: Provider | null) {
  provider = p;
}

export function setAnalyticsOptOut(value: boolean) {
  optedOut = value;
  if (value) provider?.reset();
}

export function isAnalyticsEnabled() {
  return !optedOut && provider !== null;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  if (optedOut || !provider) {
    if (__DEV__) console.log('[analytics:noop]', event, props ?? '');
    return;
  }
  try {
    provider.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}

export function identify(anonymousId: string, props?: AnalyticsProps) {
  if (optedOut || !provider) return;
  try {
    provider.identify(anonymousId, props);
  } catch {}
}

export function resetAnalytics() {
  try {
    provider?.reset();
  } catch {}
}
