export type Tier = { days: number; name: string };

/** Milestone tiers. Names are the celebration headline. */
export const TIERS: Tier[] = [
  { days: 1, name: 'Spark' },
  { days: 3, name: 'Ember' },
  { days: 7, name: 'Momentum' },
  { days: 14, name: 'Guardian' },
  { days: 30, name: 'Fortress' },
  { days: 45, name: 'Steady' },
  { days: 60, name: 'Clear' },
  { days: 90, name: 'Rewired' },
  { days: 120, name: 'Sovereign' },
  { days: 365, name: 'Free' },
];

export function currentTier(days: number): Tier | null {
  let t: Tier | null = null;
  for (const tier of TIERS) if (days >= tier.days) t = tier;
  return t;
}

export function nextTier(days: number): Tier | null {
  return TIERS.find((t) => t.days > days) ?? null;
}
