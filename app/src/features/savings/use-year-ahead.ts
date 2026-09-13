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
  /** whole hours, for the paywall line */
  hours: number;
  /** "drinking and smoking" — the habits as things one stops doing */
  quitting: string;
  rows: WorkedOutRow[];
  currency: string;
};

/** "drink" → "drinking"; "watch porn" → "watching porn"; "do it" → "this". */
function gerund(verb: string): string {
  if (verb === 'do it') return 'this';
  const [head, ...rest] = verb.split(' ');
  const ing = head.endsWith('e') ? `${head.slice(0, -1)}ing` : /[aeiou][bdgklmnprt]$/.test(head) && !head.endsWith('ll') ? `${head}${head.slice(-1)}ing` : `${head}ing`;
  return [ing, ...rest].join(' ');
}

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

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
    const verbs = profile.habits.map((id) => habits.find((h) => h.id === id)?.verb ?? 'do it');
    return {
      money: moneyKnown && year.money >= 20 ? formatMoney(year.money, currency) : null,
      time: humanDuration(year.minutes),
      hours: Math.round(year.minutes / 60),
      quitting: joinAnd([...new Set(verbs.map(gerund))]),
      rows,
      currency,
    };
  }, [currency, overrides, profile]);
}
