/**
 * What the body and brain do after you stop.
 *
 * Every serious cessation app ships this and it is the most-cited reason
 * people say they kept going — a streak counts days, this says what the days
 * bought you.
 *
 * Sourced from public health bodies (NHS, CDC, WHO for nicotine and alcohol)
 * and kept deliberately modest where the evidence is weaker. Rules:
 *
 *   - No claim we can't point at a source for.
 *   - Hedged language where the science hedges ("most people report", not
 *     "you will"). The ui-ux skill forbids promising outcomes and that applies
 *     here more than anywhere.
 *   - Nothing about curing anything.
 */
export type Milestone = {
  /** hours after the quit moment */
  at: number;
  title: string;
  body: string;
};

const HOUR = 1;
const DAY = 24;
const WEEK = 24 * 7;
const MONTH = 24 * 30;
const YEAR = 24 * 365;

/** Nicotine — the best-evidenced timeline of the set. */
const NICOTINE: Milestone[] = [
  { at: 0.33, title: '20 minutes', body: 'Heart rate and blood pressure start dropping back toward normal.' },
  { at: 12 * HOUR, title: '12 hours', body: 'Carbon monoxide in your blood falls to a normal level, so more oxygen reaches your organs.' },
  { at: 2 * DAY, title: '48 hours', body: 'Nicotine has left your body. Taste and smell begin to sharpen.' },
  { at: 3 * DAY, title: '72 hours', body: 'Breathing feels easier as the airways relax. Withdrawal usually peaks around here — it eases from now on.' },
  { at: 2 * WEEK, title: '2 weeks', body: 'Circulation improves and walking and exercise get noticeably easier.' },
  { at: MONTH, title: '1 month', body: 'Coughing and shortness of breath ease as the lungs begin clearing themselves.' },
  { at: 3 * MONTH, title: '3 months', body: 'Lung function measurably improves — up to around 10% in many people.' },
  { at: 9 * MONTH, title: '9 months', body: 'The cilia in your lungs have largely recovered, so infections become less frequent.' },
  { at: YEAR, title: '1 year', body: 'Your excess risk of coronary heart disease is about half that of someone still smoking.' },
  { at: 5 * YEAR, title: '5 years', body: 'Stroke risk can fall to that of a non-smoker.' },
];

/** Alcohol. */
const ALCOHOL: Milestone[] = [
  { at: 12 * HOUR, title: '12 hours', body: 'Blood sugar and hydration start to stabilise.' },
  { at: 3 * DAY, title: '72 hours', body: 'The heaviest withdrawal usually passes. Sleep begins to settle.' },
  { at: WEEK, title: '1 week', body: 'Deep sleep returns, which is most of why energy and mood lift.' },
  { at: 2 * WEEK, title: '2 weeks', body: 'The stomach lining recovers and acid reflux tends to ease.' },
  { at: MONTH, title: '1 month', body: 'Liver fat can fall substantially. Skin and eyes often look clearer.' },
  { at: 3 * MONTH, title: '3 months', body: 'Blood pressure and immune function improve; concentration usually sharpens.' },
  { at: 6 * MONTH, title: '6 months', body: 'Liver enzymes commonly return to a normal range.' },
  { at: YEAR, title: '1 year', body: 'Alcohol-related risks to the heart, liver and several cancers are meaningfully reduced.' },
];

/** Cannabis. */
const WEED: Milestone[] = [
  { at: DAY, title: '24 hours', body: 'Dreams often return vividly — REM sleep rebounds once THC is out of the picture.' },
  { at: 3 * DAY, title: '72 hours', body: 'Irritability and appetite changes usually peak here, then settle.' },
  { at: WEEK, title: '1 week', body: 'Short-term memory and focus start to sharpen.' },
  { at: 2 * WEEK, title: '2 weeks', body: 'Sleep normalises for most people. Anxiety tends to settle with it.' },
  { at: MONTH, title: '1 month', body: 'Cognitive studies find attention and verbal memory improve around this point.' },
  { at: 3 * MONTH, title: '3 months', body: 'Cannabinoid receptor density has largely returned to baseline.' },
];

/**
 * Behavioural habits — porn, social media, gambling.
 *
 * The evidence here is thinner than for substances, so the copy is about
 * habit formation and reported experience rather than physiology. No dopamine
 * "receptor reset" claims: that is the exact overreach this app avoids.
 */
const BEHAVIOURAL: Milestone[] = [
  { at: 3 * DAY, title: '72 hours', body: 'The first stretch is the hardest. Urges are frequent now and get less so from here.' },
  { at: WEEK, title: '1 week', body: 'The automatic reach for it weakens once the cue stops being rewarded.' },
  { at: 2 * WEEK, title: '2 weeks', body: 'Most people report urges arriving less often, and passing faster when they do.' },
  { at: MONTH, title: '1 month', body: 'Attention span and sleep are the two things people most often say improved.' },
  { at: 3 * MONTH, title: '3 months', body: 'The new response has had long enough to become the default one.' },
  { at: 6 * MONTH, title: '6 months', body: 'Habits held this long are substantially less likely to return.' },
];

const BY_HABIT: Record<string, Milestone[]> = {
  smoking: NICOTINE,
  vaping: NICOTINE,
  alcohol: ALCOHOL,
  weed: WEED,
  porn: BEHAVIOURAL,
  social: BEHAVIOURAL,
  gambling: BEHAVIOURAL,
  other: BEHAVIOURAL,
};

export function timelineFor(habitId: string): Milestone[] {
  return BY_HABIT[habitId] ?? BEHAVIOURAL;
}

export type TimelineEntry = Milestone & { reached: boolean; progress: number };

/** Mark each milestone reached or not, given hours clean. */
export function progressThrough(habitId: string, hoursClean: number): TimelineEntry[] {
  const list = timelineFor(habitId);
  return list.map((m, i) => {
    const from = i === 0 ? 0 : list[i - 1].at;
    const span = m.at - from;
    const progress = span <= 0 ? 1 : Math.max(0, Math.min(1, (hoursClean - from) / span));
    return { ...m, reached: hoursClean >= m.at, progress };
  });
}

/** The next thing to look forward to, or null once they're all done. */
export function nextMilestone(habitId: string, hoursClean: number): Milestone | null {
  return timelineFor(habitId).find((m) => hoursClean < m.at) ?? null;
}
