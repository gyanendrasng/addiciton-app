/**
 * Analytics seam.
 *
 * Every screen talks to this; only this talks to PostHog. Two tiers, one gate
 * each, and which tier an event belongs to is decided here, not at the call.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RULES — these are not style preferences, they keep the app in agreement with
 * its published privacy policy and its store filings:
 *
 * 1. NEVER send anything the user WROTE. No journal text, no reasons, no
 *    relapse or check-in notes, no free-text triggers. Not truncated, not
 *    hashed, not "just the first few words". This is the line /privacy draws,
 *    and the Apple and Play data filings are made on the strength of it.
 *
 * 2. Two tiers.
 *    **Product analytics** — on by default, off in Settings. Which screens
 *    open, where onboarding is left, whether the paywall converts, which game
 *    is played from the Games tab. Anonymous: a random device id, never
 *    `identify()`, and nothing in the props that says which habit someone is
 *    quitting. This is ordinary app analytics and carries no health data.
 *    **Progress data** — off until the person says yes (the onboarding ask,
 *    or Settings). Which habits, streaks, slips, urges, milestones, shield use,
 *    and session recordings; sent under the account id. Which habits someone
 *    is quitting is health data — special category under GDPR, sensitive under
 *    Play's User Data policy, consumer health data in Washington — so this
 *    tier waits for consent, and nothing in it is buffered past a "no".
 *    `PROGRESS` below is the one list; a tier-1 event must stay habit-free.
 *
 * 3. No autocapture, no heatmaps. Session replay records screenshots and only
 *    ever runs under tier 2 — so every `TextInput` that takes prose or
 *    personal data, and every `Text` that draws user-written text, must be
 *    wrapped in `PostHogMaskView`. Nothing is masked by config:
 *    `maskAllTextInputs` blacks out every RN <Text>. See `posthog.ts`.
 *
 * 4. Identity is the opaque Better Auth user id — account-scoped, not
 *    device-scoped, so progress follows the person across devices. Never the
 *    email, never the name. It is attached only under tier 2: `session.tsx`
 *    calls `identify()` on sign-in and the seam holds it until consent.
 *    NOTE for the store forms: tier 1 is "collected, not linked to you";
 *    tier 2 is linked, because the id is the account id.
 *
 * Changing a tier changes the app's privacy posture. Before shipping:
 *   - /privacy §3c describes both tiers; keep the code and that section in
 *     agreement, in both directions
 *   - Apple's App Privacy answers and Google Play's Data safety form must
 *     match (docs/APPSTORE.md, docs/PLAY.md)
 * A mismatch between those and the shipped app is the top policy-takedown risk.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { nowDate } from './clock';
import { posthog } from './posthog';

/** Interaction events. Keep this list closed — no free-form event names. */
export type AnalyticsEvent =
  // onboarding funnel
  | 'onboarding_started'
  | 'onboarding_step_viewed'
  | 'onboarding_quiz_completed'
  | 'onboarding_completed'
  | 'habits_chosen'
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
  | 'review_prompted'
  // shield (Screen Time)
  | 'shield_set_up'
  | 'shield_lock_started'
  | 'shield_lock_ended_early'
  | 'shield_window_enabled'
  // accounts
  | 'signup_completed'
  | 'signin_completed'
  | 'account_deleted';

/** Only primitives, and only non-identifying ones. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export type Tier = 'product' | 'progress';

/**
 * Which events are progress data. Everything not listed is product analytics,
 * so an event that says anything about a habit, a streak, an urge or a slip
 * goes in here first.
 */
const PROGRESS: ReadonlySet<AnalyticsEvent> = new Set<AnalyticsEvent>([
  'habits_chosen',
  'pledge_made',
  'checkin_saved',
  'urge_started',
  'urge_step_completed',
  'urge_survived',
  'urge_slipped',
  'urge_abandoned',
  'relapse_logged',
  'relapse_undone',
  'milestone_reached',
  'review_prompted',
  'shield_set_up',
  'shield_lock_started',
  'shield_lock_ended_early',
  'shield_window_enabled',
]);

export function tierOf(event: AnalyticsEvent, props?: AnalyticsProps): Tier {
  if (PROGRESS.has(event)) return 'progress';
  // A game from the Games tab is product use; a game mid-urge says there was an urge.
  if (event === 'game_played' && props?.where === 'urge') return 'progress';
  return 'product';
}

type Provider = {
  capture: (event: AnalyticsEvent, props?: AnalyticsProps, at?: Date) => void;
  screen: (name: string, props?: AnalyticsProps) => void;
  identify: (anonymousId: string, props?: AnalyticsProps) => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
};

/**
 * PostHog rejects `undefined` values (its `JsonType` has no room for them), and
 * our own prop type allows them so call sites can pass optional fields without
 * ceremony. Drop the empty ones rather than sending nulls, which would show up
 * in PostHog as a real recorded value.
 */
function defined(props?: AnalyticsProps): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// Bound once so TypeScript keeps the non-null narrowing inside the closures.
const client = posthog;

let provider: Provider | null = client
  ? {
      capture: (event, props, at) => client.capture(event, defined(props), at ? { timestamp: at } : undefined),
      screen: (name, props) => client.screen(name, defined(props)),
      identify: (id, props) => client.identify(id, { $set: defined(props) }),
      reset: () => client.reset(),
      startRecording: () => void client.startSessionRecording(false),
      stopRecording: () => void client.stopSessionRecording(),
    }
  : null;

/** Wire a provider in (e.g. PostHog). Called once at startup, if enabled. */
export function setAnalyticsProvider(p: Provider | null) {
  provider = p;
}

/*
 * The two gates.
 *
 * `productOn` is the Settings switch: off means nothing at all leaves, tier 2
 * included, and PostHog itself is told to opt out.
 *
 * `consent` is the progress-data decision. `pending` — no answer stored yet,
 * which is the whole of onboarding — behaves like "no" on the wire but holds
 * tier-2 events in memory with their own timestamps; a "yes" replays them in
 * order after `identify`, a "no" throws them away. Nothing in tier 2 leaves
 * the device before the answer, which is what the consent screen promises.
 * Bounded so a stalled onboarding can't grow it without limit.
 */
type Consent = 'pending' | 'in' | 'out';
let productOn = true;
let consent: Consent = 'pending';
const PRE_CONSENT_CAP = 200;
let preConsent: { event: AnalyticsEvent; props?: AnalyticsProps; at: Date }[] = [];

/**
 * The identity we were handed before consent, attached the moment the user
 * says yes. Sign-in resolves on launch, long before the consent screen; without
 * this the identify() call was dropped and every consenting user stayed
 * anonymous until their next cold start.
 */
let pendingIdentity: { id: string; props?: AnalyticsProps } | null = null;

const progressLive = () => productOn && consent === 'in' && provider !== null;

function applyClientOptOut() {
  if (!posthog) return;
  if (productOn) void posthog.optIn();
  else void posthog.optOut();
}

/** The Settings switch for product analytics. Off silences everything. */
export function setProductAnalytics(on: boolean) {
  productOn = on;
  applyClientOptOut();
  if (!on) provider?.stopRecording();
  else if (consent === 'in') attachProgress();
}

/** Backwards-compatible name: the progress-data decision as a boolean. */
export function setAnalyticsOptOut(value: boolean) {
  setAnalyticsConsent(value ? 'out' : 'in');
}

/** Apply the progress-data decision — or the lack of one. */
export function setAnalyticsConsent(value: Consent) {
  consent = value;
  if (value === 'out') {
    preConsent = [];
    provider?.stopRecording();
    provider?.reset();
    return;
  }
  if (value === 'pending') return;
  attachProgress();
}

/** Consent is in: attach the identity, start recording, send what was held. */
function attachProgress() {
  if (!progressLive() || !provider) return;
  if (pendingIdentity) {
    try {
      provider.identify(pendingIdentity.id, pendingIdentity.props);
    } catch {}
  }
  provider.startRecording();
  const held = preConsent;
  preConsent = [];
  for (const e of held) {
    try {
      provider.capture(e.event, e.props, e.at);
    } catch {}
  }
}

export function isAnalyticsEnabled() {
  return productOn && provider !== null;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  const tier = tierOf(event, props);
  const live = tier === 'product' ? productOn && provider !== null : progressLive();
  if (!live || !provider) {
    if (tier === 'progress' && productOn && consent === 'pending' && provider && preConsent.length < PRE_CONSENT_CAP) {
      preConsent.push({ event, props, at: nowDate() });
    }
    if (__DEV__) console.log(`[analytics:noop:${tier}]`, event, props ?? '');
    return;
  }
  try {
    provider.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}

/**
 * Screens whose opening says something about the person's recovery — an urge,
 * a slip, a milestone, a check-in. Opening them is progress data; every other
 * screen view is product analytics.
 */
const PROGRESS_SCREENS = ['/urge', '/relapse', '/milestone', '/milestones', '/recovery', '/checkin', '/reasons', '/savings'];

/**
 * Screen views, routed through the same gate as `track`.
 *
 * Calling `posthog.screen()` directly works while opted in and vanishes
 * silently while opted out — the SDK drops the event with no log, so a screen
 * that "isn't being captured" is indistinguishable from a broken tracker.
 * Going through here gives screens the same dev noop log as every event.
 */
export function trackScreen(name: string, props?: AnalyticsProps) {
  const sensitive = PROGRESS_SCREENS.some((p) => name === p || name.startsWith(`${p}/`));
  const live = sensitive ? progressLive() : productOn && provider !== null;
  if (!live || !provider) {
    if (__DEV__) console.log(`[analytics:noop:${sensitive ? 'progress' : 'product'}] $screen`, name, props ?? '');
    return;
  }
  try {
    provider.screen(name, props);
  } catch {
    // analytics must never break the app
  }
}

/** The account id. Held until progress consent; tier 1 stays anonymous. */
export function identify(anonymousId: string, props?: AnalyticsProps) {
  pendingIdentity = { id: anonymousId, props };
  if (!progressLive() || !provider) return;
  try {
    provider.identify(anonymousId, props);
  } catch {}
}

export function resetAnalytics() {
  pendingIdentity = null;
  try {
    provider?.reset();
  } catch {}
}
