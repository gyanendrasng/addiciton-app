import { buildSteps, habits, PROGRAM_DAYS } from './content';

export type Answers = Record<string, number[]>; // questionId -> selected option indexes

/** Weighted answers normalized into a 40–90 dependency score. */
export function selectedHabits(answers: Answers) {
  const idxs = answers['habit'] ?? [];
  const picked = idxs.map((i) => habits[i]).filter(Boolean);
  return picked.length ? picked : [habits[habits.length - 1]];
}

const NONE_LABEL = 'None of these';

/** The dependency score is deliberately banded, not a raw 0–100 percentage. */
export const SCORE_MIN = 40;
export const SCORE_MAX = 90;
export const SCORE_MID = Math.round((SCORE_MIN + SCORE_MAX) / 2);

/** Copy that matches the score, so the screen can't overclaim at the low end. */
export function scoreBlurb(score: number): string {
  if (score < 55)
    return 'A mild pattern — but patterns compound. This is the easiest it will ever be to change.';
  if (score < 70)
    return 'A meaningful pattern, and a very workable one. It’s not a verdict — it’s a starting line.';
  if (score < 82)
    return 'A strong pattern with a real hold on your routine. It’s not a verdict — it’s a starting line.';
  return 'A deeply established pattern. That makes this hard, not hopeless — and it’s where the program helps most.';
}

/** Union of the selected habits' symptoms, deduped, "None of these" last. */
export function mergedSymptoms(answers: Answers) {
  const seen = new Set<string>();
  const out: { label: string; weight: number }[] = [];
  for (const h of selectedHabits(answers)) {
    for (const o of h.symptoms) {
      if (o.label === NONE_LABEL || seen.has(o.label)) continue;
      seen.add(o.label);
      out.push(o);
    }
  }
  return [...out.slice(0, 8), { label: NONE_LABEL, weight: 0 }];
}

export function computeScore(answers: Answers): number {
  let total = 0;
  let max = 0;
  for (const step of buildSteps(selectedHabits(answers))) {
    if (step.kind === 'question') {
      const weights = step.options.map((o) => o.weight);
      max += Math.max(...weights);
      const sel = answers[step.id]?.[0];
      if (sel != null) total += step.options[sel].weight;
    } else if (step.kind === 'multi') {
      if (step.id === 'habit') continue; // context, not severity
      const options = step.id === 'symptoms' ? mergedSymptoms(answers) : step.options;
      const sum = options.reduce((a, o) => a + o.weight, 0);
      max += sum * 0.6;
      for (const i of answers[step.id] ?? []) total += options[i]?.weight ?? 0;
    }
  }
  if (max === 0) return SCORE_MID;
  const ratio = Math.min(1, total / max);
  return Math.round(SCORE_MIN + ratio * (SCORE_MAX - SCORE_MIN));
}

export function freedomDate(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + PROGRAM_DAYS);
  return d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatFreedomDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatFreedomDateLong(d: Date): string {
  const FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
