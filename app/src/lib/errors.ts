/**
 * Turning failures into sentences a person can act on.
 *
 * Raw errors from the network stack are useless and slightly alarming — a user
 * who taps "Send code" with no signal should not read
 * "UnexpectedException: A TLS error caused the secure connection to fail
 * (at ExpoModulesCore/Promise.swift:56)". Every user-facing catch goes through
 * `humanError` so the copy says what happened and what to do about it.
 *
 * Rules: no stack traces, no module paths, no HTTP status codes, no jargon.
 * Say whose fault it is only when that helps the user decide what to do next.
 */

/** Strings that mean "the request never reached us". */
const OFFLINE_MARKERS = [
  'network request failed',
  'fetch failed',
  'tls',
  'ssl',
  'certificate',
  'could not connect',
  'connection appears to be offline',
  'timed out',
  'timeout',
  'enotfound',
  'econnrefused',
  'dns',
  'hostname could not be found',
];

const RATE_LIMIT_MARKERS = ['too many', 'rate limit', 'rate_limit', '429'];

/**
 * Messages the server writes for us are already user-facing, so they pass
 * through. Anything longer than this, or containing code-shaped text, doesn't.
 */
const MAX_PASSTHROUGH = 140;

function looksLikeCode(text: string): boolean {
  return (
    /\bat\s+\w+[./]/.test(text) || // stack frame
    /\.(swift|ts|tsx|js|java|kt):\d+/.test(text) || // file:line
    /[{}<>]|::|\bError:\s*\w+Error\b/.test(text)
  );
}

export type ErrorContext = 'signin' | 'code' | 'network' | 'generic';

const FALLBACK: Record<ErrorContext, string> = {
  signin: 'Couldn’t sign you in. Please try again.',
  code: 'Couldn’t send your code. Please try again.',
  network: 'Couldn’t reach Curb. Check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
};

/**
 * @param e        whatever was thrown or returned
 * @param context  what the user was doing, used for the fallback wording
 */
export function humanError(e: unknown, context: ErrorContext = 'generic'): string {
  const raw =
    typeof e === 'string'
      ? e
      : e && typeof e === 'object' && 'message' in e
        ? String((e as { message?: unknown }).message ?? '')
        : '';
  const lower = raw.toLowerCase();

  if (OFFLINE_MARKERS.some((m) => lower.includes(m))) {
    return 'Couldn’t reach Curb. Check your connection and try again.';
  }
  if (RATE_LIMIT_MARKERS.some((m) => lower.includes(m))) {
    return 'Too many attempts. Wait a minute, then try again.';
  }

  // A short, prose-shaped message from our own server is better than a guess.
  if (raw && raw.length <= MAX_PASSTHROUGH && !looksLikeCode(raw)) {
    return raw.endsWith('.') || raw.endsWith('?') || raw.endsWith('!') ? raw : `${raw}.`;
  }

  return FALLBACK[context];
}
