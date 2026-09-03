/**
 * All onboarding copy and structure lives here — swapping the niche or
 * rewording the quiz means editing this file only.
 */
export type Option = { label: string; weight: number };

export type Habit = {
  id: string;
  label: string;
  /** verb phrase used in quiz copy: "How often do you {verb}?" */
  verb: string;
  symptoms: Option[];
};

export const habits: Habit[] = [
  {
    id: 'porn',
    label: 'Porn',
    verb: 'watch porn',
    symptoms: [
      { label: 'Brain fog', weight: 3 },
      { label: 'Low energy or motivation', weight: 3 },
      { label: 'Anxiety', weight: 3 },
      { label: 'Less interest in real intimacy', weight: 4 },
      { label: 'Shame after watching', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'alcohol',
    label: 'Alcohol',
    verb: 'drink',
    symptoms: [
      { label: 'Poor sleep', weight: 3 },
      { label: 'Regret the next morning', weight: 3 },
      { label: 'Anxiety', weight: 3 },
      { label: 'Drinking alone or in secret', weight: 4 },
      { label: 'Low energy or motivation', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'smoking',
    label: 'Smoking',
    verb: 'smoke',
    symptoms: [
      { label: 'Short of breath', weight: 3 },
      { label: 'Low energy', weight: 3 },
      { label: 'Smoking first thing in the morning', weight: 4 },
      { label: 'Anxiety without a cigarette', weight: 3 },
      { label: 'Hiding it from people', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'vaping',
    label: 'Vaping',
    verb: 'vape',
    symptoms: [
      { label: 'Reaching for it without thinking', weight: 4 },
      { label: 'Anxiety without it nearby', weight: 3 },
      { label: 'Poor sleep', weight: 3 },
      { label: 'Short of breath', weight: 3 },
      { label: 'Hiding it from people', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'weed',
    label: 'Weed',
    verb: 'smoke weed',
    symptoms: [
      { label: 'Brain fog', weight: 3 },
      { label: 'Low motivation', weight: 4 },
      { label: 'Needing it to relax or sleep', weight: 3 },
      { label: 'Memory slips', weight: 3 },
      { label: 'Anxiety', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'social',
    label: 'Social media',
    verb: 'scroll',
    symptoms: [
      { label: 'Doomscrolling late at night', weight: 4 },
      { label: 'Trouble focusing', weight: 3 },
      { label: 'Opening the apps without thinking', weight: 3 },
      { label: 'Comparing yourself to others', weight: 3 },
      { label: 'Poor sleep', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'gambling',
    label: 'Gambling',
    verb: 'gamble',
    symptoms: [
      { label: 'Chasing losses', weight: 4 },
      { label: 'Hiding it from people', weight: 3 },
      { label: 'Money stress', weight: 3 },
      { label: 'Anxiety', weight: 3 },
      { label: 'Low mood after playing', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
  {
    id: 'other',
    label: 'Something else',
    verb: 'do it',
    symptoms: [
      { label: 'Brain fog', weight: 3 },
      { label: 'Low energy or motivation', weight: 3 },
      { label: 'Anxiety', weight: 3 },
      { label: 'Shame afterwards', weight: 3 },
      { label: 'Poor sleep', weight: 3 },
      { label: 'None of these', weight: 0 },
    ],
  },
];

export type Step =
  | { kind: 'welcome' }
  | { kind: 'framing' }
  | { kind: 'question'; id: string; title: string; subtitle?: string; options: Option[] }
  | { kind: 'multi'; id: string; title: string; subtitle?: string; options: Option[] }
  | { kind: 'interstitial'; title: string; body: string; footnote?: string }
  | { kind: 'analyzing' }
  | { kind: 'score' }
  | { kind: 'date' }
  | { kind: 'plan' }
  | { kind: 'signature' }
  | { kind: 'notifications' }
  | { kind: 'paywall' };

export const steps: Step[] = [
  { kind: 'welcome' },
  { kind: 'framing' },
  {
    kind: 'multi',
    id: 'habit',
    title: 'What are you quitting?',
    subtitle: 'Pick everything you’re fighting — the plan covers all of it.',
    options: habits.map((h) => ({ label: h.label, weight: 0 })),
  },
  {
    kind: 'question',
    id: 'frequency',
    title: 'How often do you {verb}?',
    options: [
      { label: 'Multiple times a day', weight: 10 },
      { label: 'About once a day', weight: 8 },
      { label: 'A few times a week', weight: 5 },
      { label: 'Weekly or less', weight: 3 },
    ],
  },
  {
    kind: 'question',
    id: 'duration',
    title: 'How long has this been part of your life?',
    options: [
      { label: 'Less than a year', weight: 2 },
      { label: '1–3 years', weight: 5 },
      { label: '3–5 years', weight: 7 },
      { label: 'More than 5 years', weight: 10 },
    ],
  },
  {
    kind: 'question',
    id: 'trigger',
    title: 'When do urges hit hardest?',
    subtitle: 'Your plan adapts to this.',
    options: [
      { label: 'Late at night', weight: 6 },
      { label: 'When I’m bored', weight: 5 },
      { label: 'When I’m stressed', weight: 6 },
      { label: 'When I’m lonely', weight: 6 },
    ],
  },
  {
    kind: 'multi',
    id: 'symptoms',
    title: 'What have you noticed?',
    subtitle: 'Select all that apply.',
    options: [], // resolved from the selected habit at render time
  },
  {
    kind: 'interstitial',
    title: 'You’re not alone.',
    body: 'Most people who try to quit on willpower alone relapse within the first three days. A system beats willpower — the next two minutes build yours.',
  },
  {
    kind: 'question',
    id: 'attempts',
    title: 'Have you tried to quit before?',
    options: [
      { label: 'Never tried', weight: 3 },
      { label: 'Once or twice', weight: 5 },
      { label: 'Several times', weight: 7 },
      { label: 'More times than I can count', weight: 9 },
    ],
  },
  {
    kind: 'multi',
    id: 'costs',
    title: 'What is it costing you?',
    subtitle: 'These become your reasons — you’ll see them when it matters.',
    options: [
      { label: 'My time', weight: 2 },
      { label: 'My relationships', weight: 3 },
      { label: 'My self-respect', weight: 3 },
      { label: 'My focus and ambition', weight: 2 },
      { label: 'My sleep', weight: 2 },
    ],
  },
  {
    kind: 'interstitial',
    title: 'Your brain can rewire.',
    body: 'Dopamine receptors begin recovering within the first two weeks of quitting. By day 90, most people report a step change in energy, focus and confidence.',
    footnote: 'That’s why your program is 90 days.',
  },
  {
    kind: 'question',
    id: 'age',
    title: 'How old are you?',
    options: [
      { label: '17–20', weight: 4 },
      { label: '21–25', weight: 5 },
      { label: '26–34', weight: 5 },
      { label: '35+', weight: 5 },
    ],
  },
  {
    kind: 'question',
    id: 'goal',
    title: 'What’s your goal?',
    options: [
      { label: 'Quit completely', weight: 5 },
      { label: 'Cut back a lot', weight: 3 },
      { label: 'Understand my habit first', weight: 2 },
    ],
  },
  { kind: 'analyzing' },
  { kind: 'score' },
  { kind: 'date' },
  { kind: 'plan' },
  { kind: 'signature' },
  { kind: 'notifications' },
  { kind: 'paywall' },
];

/** Expand the base steps for the picked habits: one frequency question per habit. */
export function buildSteps(picked: Habit[]): Step[] {
  const out: Step[] = [];
  for (const s of steps) {
    if (s.kind === 'question' && s.id === 'frequency') {
      for (const h of picked) {
        out.push({
          ...s,
          id: `frequency:${h.id}`,
          title: s.title.replace('{verb}', h.verb),
          subtitle: picked.length > 1 ? h.label : undefined,
        });
      }
    } else {
      out.push(s);
    }
  }
  return out;
}

export function quizRangeOf(list: Step[]) {
  const first = list.findIndex((s) => s.kind === 'question' || s.kind === 'multi');
  let last = first;
  list.forEach((s, i) => {
    if (s.kind === 'question' || s.kind === 'multi' || s.kind === 'interstitial') last = i;
  });
  return { first, last };
}

export const analyzingLines = [
  'Reading your answers',
  'Mapping your triggers',
  'Charting your rewiring timeline',
  'Building your plan',
];

export const PROGRAM_DAYS = 90;
