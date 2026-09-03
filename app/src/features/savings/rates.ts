/**
 * What the habit was costing, per habit.
 *
 * Every competitor leads with "money saved" and we already collect the two
 * inputs during onboarding — which habits, and how often — so the only thing
 * missing was a price. These are defaults, editable in Settings; a number the
 * user has corrected themselves is far more motivating than one we guessed.
 *
 * Deliberately conservative. Overstating what someone saved is the same
 * category of mistake as overstating what the app does.
 */
export type Rate = {
  /** what one occurrence costs, in the user's currency */
  cost: number;
  /** how long one occurrence takes, in minutes */
  minutes: number;
  /** what one occurrence is called: "a drink", "a cigarette" */
  unit: string;
  /** plural, for counts: "drinks" */
  units: string;
};

/**
 * Per-occurrence defaults, priced in **US dollars**.
 *
 * Currency is a setting that defaults to USD rather than being read from the
 * device locale — a fixed number with a locale-derived symbol is the worst of
 * both: "6" is a plausible drink in Chicago and absurd in Mumbai, and the app
 * would have shown ₹6 without ever being told the price.
 *
 * So the pair travels together. These figures hold while the currency is USD;
 * pick another and they're withheld until the user gives a real one
 * (`ratesFor` below). Minutes are currency-independent and always apply.
 */
export const BASE_CURRENCY = 'USD';

export const DEFAULT_RATES: Record<string, Rate> = {
  porn: { cost: 0, minutes: 35, unit: 'session', units: 'sessions' },
  alcohol: { cost: 6, minutes: 45, unit: 'drink', units: 'drinks' },
  smoking: { cost: 0.75, minutes: 7, unit: 'cigarette', units: 'cigarettes' },
  vaping: { cost: 1.2, minutes: 5, unit: 'session', units: 'sessions' },
  weed: { cost: 8, minutes: 60, unit: 'session', units: 'sessions' },
  social: { cost: 0, minutes: 40, unit: 'scroll', units: 'scrolls' },
  gambling: { cost: 20, minutes: 45, unit: 'session', units: 'sessions' },
  other: { cost: 0, minutes: 30, unit: 'session', units: 'sessions' },
};

export function defaultRate(habitId: string): Rate {
  return DEFAULT_RATES[habitId] ?? DEFAULT_RATES.other;
}

/**
 * The rate to use for a habit, given the chosen currency and any price the
 * user has set.
 *
 * A dollar default must not be relabelled as another currency — that's how you
 * end up telling someone a drink costs ₹6. Outside USD, an unset price stays
 * unset until they enter one.
 */
export function ratesFor(
  habitIds: string[],
  currency: string,
  overrides: Record<string, Rate> | undefined,
): Record<string, Rate> {
  const out: Record<string, Rate> = {};
  for (const id of habitIds) {
    const base = defaultRate(id);
    const set = overrides?.[id];
    if (set) out[id] = set;
    else out[id] = currency === BASE_CURRENCY ? base : { ...base, cost: 0 };
  }
  return out;
}


/**
 * Occurrences per day, from the onboarding frequency answer.
 *
 * The options are, in order:
 *   0 Multiple times a day · 1 About once a day
 *   2 A few times a week   · 3 Weekly or less
 *
 * "Multiple" is taken as 3 rather than something larger — the honest low end
 * of a vague answer.
 */
const PER_DAY = [3, 1, 3 / 7, 1 / 7];

export function perDayFor(habitId: string, answers: Record<string, number[]>): number {
  const idx = answers[`frequency:${habitId}`]?.[0] ?? answers['frequency']?.[0];
  if (idx == null) return PER_DAY[1]; // no answer: assume daily
  return PER_DAY[idx] ?? PER_DAY[1];
}

export type Saved = {
  money: number;
  minutes: number;
  /** occurrences avoided, for the "N cigarettes not smoked" line */
  occurrences: number;
};

/**
 * What a clean run adds up to.
 *
 * `days` is fractional so the numbers move during the day rather than jumping
 * at midnight — the same reason the streak shows hours.
 */
export function savedFor(
  habitIds: string[],
  answers: Record<string, number[]>,
  days: number,
  rates: Record<string, Rate>,
): Saved {
  let money = 0;
  let minutes = 0;
  let occurrences = 0;
  for (const id of habitIds) {
    const rate = rates[id] ?? defaultRate(id);
    const n = perDayFor(id, answers) * Math.max(0, days);
    money += n * rate.cost;
    minutes += n * rate.minutes;
    occurrences += n;
  }
  return { money, minutes, occurrences };
}

/** "6 days" / "14 hours" / "40 minutes" — the largest unit that isn't silly. */
export function humanDuration(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${Math.floor(hours)} hr`;
  const days = hours / 24;
  if (days < 60) return `${Math.floor(days)} days`;
  return `${Math.floor(days / 7)} weeks`;
}
