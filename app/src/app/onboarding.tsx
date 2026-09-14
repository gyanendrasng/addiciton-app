import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tap } from '@/components/ui/tap';
import { Spacing } from '@/theme/spacing';
import { palette } from '@/theme/palette';
import { buildSteps, quizRangeOf, type Step } from '@/features/onboarding/content';
import { computeScore, mergedSymptoms, selectedHabits } from '@/features/onboarding/lib';
import { completeOnboarding } from '@/features/onboarding/complete';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/state';
import { track } from '@/lib/analytics';
import { Chevron, ProgressBar, StepFrame, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { MultiSelect, SingleSelect } from '@/features/onboarding/components/options';
import { Analyzing, DateStep, ScoreStep } from '@/features/onboarding/components/hero-steps';
import { SavingsStep } from '@/features/onboarding/components/savings-step';
import { Framing, Interstitial, Plan, Welcome } from '@/features/onboarding/components/intro-steps';
import { Analytics, Notifications, Signature } from '@/features/onboarding/components/closing-steps';

function Flow() {
  const { index, direction, answers, dispatch } = useOnboarding();
  const router = useRouter();

  // Track when the user first sees the onboarding flow.
  useEffect(() => {
    track('onboarding_started');
  }, []);
  const picked = selectedHabits(answers);
  const effSteps = useMemo(() => buildSteps(picked), [picked]);
  const step = effSteps[Math.min(index, effSteps.length - 1)];

  /**
   * One event per screen shown, so the funnel says *which* of the ~20 steps
   * people leave on rather than just that they left. `analyzing` doubles as
   * the end of the quiz — it is the first step after the last question.
   */
  useEffect(() => {
    track('onboarding_step_viewed', { index, step: stepName(step), direction: direction < 0 ? 'back' : 'forward' });
    if (step.kind === 'analyzing') track('onboarding_quiz_completed', { habit_count: picked.length });
    // `step` is derived from `index`; re-firing on answer changes would double-count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const next = useCallback(() => {
    dispatch({ type: 'goto', index: Math.min(index + 1, effSteps.length - 1), direction: 1 });
  }, [dispatch, effSteps.length, index]);
  const back = useCallback(() => {
    let prev = index - 1;
    if (prev >= 0 && effSteps[prev].kind === 'analyzing') prev -= 1;
    if (prev >= 0) dispatch({ type: 'goto', index: prev, direction: -1 });
  }, [dispatch, effSteps, index]);
  const done = useCallback(async () => {
    const picked = selectedHabits(answers);
    // Product tier: the funnel, habit-free. Progress tier: what was chosen.
    track('onboarding_completed', { habit_count: picked.length });
    track('habits_chosen', { habits: picked.map((h) => h.id).join(','), score: computeScore(answers) });
    await completeOnboarding(answers);
    router.replace('/');
  }, [answers, router]);

  const score = useMemo(() => computeScore(answers), [answers]);

  const quizRange = quizRangeOf(effSteps);
  const inQuiz = index >= quizRange.first && index <= quizRange.last;
  const quizTotal = quizRange.last - quizRange.first + 1;
  const quizPos = index - quizRange.first + 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {index > 0 && step.kind !== 'analyzing' ? (
          <>
            <Tap haptic="none" onPress={back} style={styles.back} accessibilityLabel="Back">
              <Chevron />
            </Tap>
            <View style={{ flex: 1 }}>
              {inQuiz ? <ProgressBar current={quizPos} total={quizTotal} /> : null}
            </View>
            <View style={styles.back} />
          </>
        ) : null}
      </View>
      <StepFrame stepKey={`step-${index}`} direction={direction}>
        {step.kind === 'welcome' && <Welcome onNext={next} />}
        {step.kind === 'framing' && <Framing onNext={next} />}
        {step.kind === 'question' && (
          <View style={styles.question}>
            <Title>{step.title}</Title>
            {step.subtitle ? <Subtitle>{step.subtitle}</Subtitle> : null}
            <View style={{ height: Spacing.five }} />
            <SingleSelect
              key={step.id}
              options={step.options}
              onAnswer={(i) => {
                dispatch({ type: 'answer', id: step.id, selection: [i] });
                next();
              }}
            />
          </View>
        )}
        {step.kind === 'multi' && (
          <View style={styles.question}>
            <Title>{step.title}</Title>
            {step.subtitle ? <Subtitle>{step.subtitle}</Subtitle> : null}
            <View style={{ height: Spacing.five }} />
            <MultiSelect
              key={step.id}
              options={step.id === 'symptoms' ? mergedSymptoms(answers) : step.options}
              onAnswer={(sel) => {
                dispatch({ type: 'answer', id: step.id, selection: sel });
                next();
              }}
            />
          </View>
        )}
        {step.kind === 'interstitial' && (
          <Interstitial title={step.title} body={step.body} footnote={step.footnote} onNext={next} />
        )}
        {step.kind === 'analyzing' && <Analyzing onDone={next} />}
        {step.kind === 'score' && <ScoreStep score={score} onNext={next} />}
        {step.kind === 'date' && <DateStep onNext={next} />}
        {step.kind === 'savings' && <SavingsStep answers={answers} onNext={next} />}
        {step.kind === 'plan' && <Plan answers={answers} onNext={next} />}
        {step.kind === 'signature' && <Signature onNext={next} />}
        {step.kind === 'notifications' && <Notifications onNext={next} />}
        {step.kind === 'analytics' && <Analytics onNext={done} />}
      </StepFrame>
    </SafeAreaView>
  );
}

/**
 * A stable, non-personal name for a step. Question ids are fixed keys and
 * interstitial titles are fixed copy — nothing here is something the user
 * typed. The per-habit frequency steps (`frequency:porn`) collapse to
 * `frequency`: this event is product analytics and must not say which habit.
 */
function stepName(step: Step): string {
  switch (step.kind) {
    case 'question':
    case 'multi':
      return step.id.startsWith('frequency:') ? 'frequency' : step.id;
    case 'interstitial':
      return `interstitial:${step.title}`;
    default:
      return step.kind;
  }
}

export default function OnboardingScreen() {
  return (
    <OnboardingProvider>
      <Flow />
    </OnboardingProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  question: { flex: 1, paddingTop: Spacing.four },
});
