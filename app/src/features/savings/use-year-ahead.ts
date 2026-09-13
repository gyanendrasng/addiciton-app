import { useMemo } from 'react';

import { useSetting } from '@/db/repo/settings';
import { useProfile } from '@/db/repo/profile';
import { habits } from '@/features/onboarding/content';
import type { WorkedOutRow } from './HowWorkedOut';
import { BASE_CURRENCY, defaultRate, humanDuration, perDayFor, ratesFor, savedFor, type Rate } from './rates';
import { CURRENCY_KEY, formatMoney, RATES_KEY } from './use-savings';

/**
 * A year ahead, not spent: what the habits would cost over the next 365 days
 * at how often the person said they happen. Same arithmetic as the onboarding
 * "What that's worth" step, read from the saved profile so the paywall can
 * show it — a projection, and labelled as one everywhere it appears.
 *
 * `money` is null when no tracked habit has a price (porn, social media),
 * and the time figure carries the point instead.
 */
export type YearAhead = {
  money: string | null;
  time: string;
  rows: WorkedOutRow[];
  currency: string;
};

export function useYearAhead(): YearAhead | null {
  const { profile } = useProfile();
  const { value: overrides } = useSetting<Record<string, Rate>>(RATES_KEY, {});
  const { value: currency } = useSetting<string>(CURRENCY_KEY, BASE_CURRENCY);

  return useMemo(() => {
    if (!profile || profile.habits.length === 0) return null;
    const rates = ratesFor(profile.habits, currency, overrides);
    const year = savedFor(profile.habits, profile.answers, 365, rates);
    const moneyKnown = profile.habits.some((id) => (rates[id]?.cost ?? 0) > 0);
    const rows: WorkedOutRow[] = profile.habits.map((id) => {
      const rate = rates[id] ?? defaultRate(id);
      return {
        id,
        label: habits.find((h) => h.id === id)?.label ?? id,
        cost: rate.cost,
        perDay: perDayFor(id, profile.answers),
        unit: rate.unit,
        units: rate.units,
        isDefault: !overrides?.[id],
      };
    });
    return {
      money: moneyKnown && year.money >= 20 ? formatMoney(year.money, currency) : null,
      time: humanDuration(year.minutes),
      rows,
      currency,
    };
  }, [currency, overrides, profile]);
}
