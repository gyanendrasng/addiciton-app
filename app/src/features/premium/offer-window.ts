/**
 * The 12-hour window on the discounted year.
 *
 * A countdown belongs on the *discount*, never on the standard price: nothing
 * about $59.99 expires, so a timer next to it is a deadline we invented. A
 * timer on $29.99 is just a limited offer — provided it is real, which is the
 * whole point of this file. When the window closes the price genuinely goes
 * back to $59.99; we don't quietly restart the clock on the next visit.
 *
 * The window opens the moment the offer is first *shown*, not when it's
 * earned, so a notification that arrives while the phone is face-down doesn't
 * burn the user's 12 hours.
 */
import { getSetting, setSetting } from '@/db/repo/settings';
import { now } from '@/lib/clock';

export const OFFER_WINDOW_HOURS = 12;
const OPENED_KEY = 'offer.window.opened.v1';

/**
 * Offers can come round again — someone who let the clock run out isn't
 * refused forever, they just don't get to sit on the price indefinitely.
 */
export const OFFER_COOLDOWN_DAYS = 7;

export type OfferWindow =
  | { state: 'open'; msLeft: number }
  | { state: 'expired'; msUntilNext: number }
  | { state: 'unopened' };

export function windowFrom(openedAt: number | null, t: number): OfferWindow {
  if (openedAt == null) return { state: 'unopened' };
  const closesAt = openedAt + OFFER_WINDOW_HOURS * 3_600_000;
  if (t < closesAt) return { state: 'open', msLeft: closesAt - t };
  const nextAt = openedAt + OFFER_COOLDOWN_DAYS * 86_400_000;
  return { state: 'expired', msUntilNext: Math.max(0, nextAt - t) };
}

/** Read the window, opening it if this is the first time the offer is shown. */
export async function openWindow(): Promise<number> {
  const existing = await getSetting<number>(OPENED_KEY);
  const t = now();
  if (existing != null) {
    // Past the cooldown, the offer comes round again with a fresh 12 hours.
    const w = windowFrom(existing, t);
    if (w.state === 'expired' && w.msUntilNext === 0) {
      await setSetting(OPENED_KEY, t);
      return t;
    }
    return existing;
  }
  await setSetting(OPENED_KEY, t);
  return t;
}

export const OFFER_OPENED_KEY = OPENED_KEY;

/** "11:59:04" — hours:minutes:seconds, tabular so it doesn't jitter. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
