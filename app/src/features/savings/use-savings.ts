/**
 * Money saved and time reclaimed.
 *
 * Everything here is derived from data the app already had — habits, the
 * onboarding frequency answers, and the current clean run — plus a per-habit
 * price the user can correct in Settings.
 */
import { useMemo } from 'react';

import { useSetting } from '@/db/repo/settings';
import { useProfile } from '@/db/repo/profile';
import { useStreak } from '@/features/streak/use-streak';
import { BASE_CURRENCY, humanDuration, ratesFor, savedFor, type Rate, type Saved } from './rates';

export const RATES_KEY = 'savings.rates.v1';
export const CURRENCY_KEY = 'savings.currency.v1';

/**
 * Currency is chosen, not detected.
 *
 * Reading it from the device locale sounds smarter but pairs a locale symbol
 * with a dollar-denominated default price, which is how "₹6 a drink" happens.
 * USD for everyone, changeable on the savings screen.
 */
export function formatMoney(amount: number, code: string = BASE_CURRENCY): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      // Whole units once it's past pocket change — "£312" reads better than
      // "£312.40", and the precision isn't real anyway.
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    // An unknown code: show the number and the code rather than nothing.
    return `${Math.round(amount)} ${code}`;
  }
}

export type SavingsState = Saved & {
  /** total clean days, fractional */
  days: number;
  moneyLabel: string;
  timeLabel: string;
  /** true when no tracked habit has a price set — hide money entirely */
  moneyUnknown: boolean;
  rates: Record<string, Rate>;
  currency: string;
};

export function useSavings(): SavingsState | null {
  const { profile } = useProfile();
  const { state } = useStreak();
  const { value: overrides } = useSetting<Record<string, Rate>>(RATES_KEY, {});
  const { value: currency } = useSetting<string>(CURRENCY_KEY, BASE_CURRENCY);

  return useMemo(() => {
    if (!profile || !state) return null;

    const rates = ratesFor(profile.habits, currency, overrides);

    // Total clean days, not the current streak: a slip doesn't hand back the
    // money you already didn't spend.
    const days = state.totalClean + state.streak.ms / 86_400_000 - Math.floor(state.streak.days);
    const saved = savedFor(profile.habits, profile.answers, Math.max(0, days), rates);
    const moneyUnknown = profile.habits.every((id) => (rates[id]?.cost ?? 0) <= 0);

    return {
      ...saved,
      days,
      rates,
      currency,
      moneyUnknown,
      moneyLabel: formatMoney(saved.money, currency),
      timeLabel: humanDuration(saved.minutes),
    };
  }, [currency, overrides, profile, state]);
}
