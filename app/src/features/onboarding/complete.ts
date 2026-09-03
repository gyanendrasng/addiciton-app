/** Onboarding → app handoff: persist the profile and seed reasons. */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { wipeDb } from '@/db/client';
import { createProfile, getProfile } from '@/db/repo/profile';
import { seedReasons } from '@/db/repo/reasons';
import { rescheduleMilestones } from '@/features/streak/milestone-schedule';
import { dayKey, now } from '@/lib/clock';
import { steps } from './content';
import { computeScore, freedomDate, selectedHabits, type Answers } from './lib';
import { markOnboarded, resetOnboarding } from './storage';

/** Turn the "what is it costing you?" picks into first-person reasons. */
const REASON_FOR_COST: Record<string, string> = {
  'My time': 'I’m taking my time back.',
  'My relationships': 'The people I love deserve the real me.',
  'My self-respect': 'I want to respect the person in the mirror.',
  'My focus and ambition': 'I have things to build, and I need my focus.',
  'My sleep': 'I want to wake up rested and clear.',
};

function reasonsFrom(answers: Answers): string[] {
  const costs = steps.find((s) => s.kind === 'multi' && s.id === 'costs');
  if (!costs || costs.kind !== 'multi') return [];
  return (answers['costs'] ?? [])
    .map((i) => costs.options[i]?.label)
    .filter((l): l is string => !!l)
    .map((l) => REASON_FOR_COST[l] ?? l);
}

export async function completeOnboarding(answers: Answers) {
  const t = now();
  await createProfile({
    quitStartedAt: t,
    habits: selectedHabits(answers).map((h) => h.id),
    score: computeScore(answers),
    freedomDate: dayKey(freedomDate(new Date(t))),
    answers,
  });
  const reasons = reasonsFrom(answers);
  if (reasons.length) await seedReasons(reasons);
  await markOnboarded(answers);
  await rescheduleMilestones();
}

/** Users who finished onboarding before the database existed: build a profile from stored answers. */
export async function migrateLegacyOnboarding(): Promise<boolean> {
  if (await getProfile()) return true;
  const flag = await AsyncStorage.getItem('onboarding.completed.v1');
  if (flag !== '1') return false;
  const raw = await AsyncStorage.getItem('onboarding.answers.v1');
  const answers: Answers = raw ? JSON.parse(raw) : {};
  const sched = await AsyncStorage.getItem('notif.scheduled');
  const started = sched ? (JSON.parse(sched).at as number | undefined) : undefined;
  const t = started ?? now();
  await createProfile({
    quitStartedAt: t,
    habits: selectedHabits(answers).map((h) => h.id),
    score: computeScore(answers),
    freedomDate: dayKey(freedomDate(new Date(t))),
    answers,
  });
  const reasons = reasonsFrom(answers);
  if (reasons.length) await seedReasons(reasons);
  return true;
}

/** Everything gone: database rows + onboarding flags. */
export async function wipeEverything() {
  await wipeDb();
  await resetOnboarding();
}
