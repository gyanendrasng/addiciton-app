import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Tap } from '@/components/ui/tap';
import { setAnswers, useProfile } from '@/db/repo/profile';
import { Subtitle } from '@/features/onboarding/components/chrome';
import { buildSteps, type Option } from '@/features/onboarding/content';
import { computeScore, mergedSymptoms, selectedHabits } from '@/features/onboarding/lib';
import { withAccess } from '@/features/premium/access';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Edit the onboarding answers after the fact.
 *
 * People answer this quiz in two minutes on day one, often inaccurately — they
 * round down how often, or skip a symptom they'd rather not name. Locking that
 * in forever is the wrong call for an app they'll open every day for 90 days.
 *
 * Changes save immediately (local-first; there is nothing to fail), and the
 * dependency score recomputes. The quit date and the freedom date are
 * deliberately untouched: those record when you started, not what you said.
 *
 * "What are you quitting?" is not here — Settings owns that, and having it in
 * two places would let them disagree.
 */
function AnswersScreen() {
  const { profile } = useProfile();

  const questions = useMemo(() => {
    if (!profile) return [];
    const picked = selectedHabits(profile.answers);
    return buildSteps(picked)
      .filter((s) => (s.kind === 'question' || s.kind === 'multi') && s.id !== 'habit')
      .map((s) => {
        const step = s as Extract<typeof s, { id: string }> & {
          title: string;
          subtitle?: string;
          options: Option[];
        };
        return {
          id: step.id,
          title: step.title,
          subtitle: step.subtitle,
          multi: s.kind === 'multi',
          // Symptoms are assembled from the picked habits at render time, so
          // they aren't in the static step.
          options: step.id === 'symptoms' ? mergedSymptoms(profile.answers) : step.options,
        };
      });
  }, [profile]);

  // Loading: keep the header so the screen never goes blank.
  if (!profile) return <Screen title="Your answers">{null}</Screen>;

  const choose = async (questionId: string, index: number, multi: boolean) => {
    const current = profile.answers[questionId] ?? [];
    let next: number[];
    if (multi) {
      next = current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index].sort((a, b) => a - b);
    } else {
      if (current[0] === index) return; // already the answer — nothing to do
      next = [index];
    }
    const answers = { ...profile.answers, [questionId]: next };
    await setAnswers(answers, computeScore(answers));
  };

  return (
    <Screen title="Your answers">
      <Subtitle>
        Change anything you rushed on day one. Your streak and freedom date stay exactly as they
        are — only your dependency score is worked out again.
      </Subtitle>

      {questions.map((q) => {
        const picked = profile.answers[q.id] ?? [];
        return (
          <View key={q.id} style={s.block}>
            <Text style={s.question}>{q.title}</Text>
            {q.subtitle ? <Text style={s.hint}>{q.subtitle}</Text> : null}
            <Card style={s.card}>
              {q.options.map((o, i) => {
                const on = picked.includes(i);
                const last = i === q.options.length - 1;
                return (
                  <View key={o.label}>
                    <Tap
                      haptic="selection"
                      onPress={() => choose(q.id, i, q.multi)}
                      accessibilityRole={q.multi ? 'checkbox' : 'radio'}
                      accessibilityState={{ checked: on, selected: on }}
                      accessibilityLabel={o.label}>
                      <View style={s.row}>
                        <Text style={[s.label, on && s.labelOn]}>{o.label}</Text>
                        {on ? (
                          Platform.OS === 'ios' ? (
                            <SymbolView
                              name="checkmark"
                              size={15}
                              weight="semibold"
                              tintColor={palette.accent}
                              style={s.check}
                            />
                          ) : (
                            <View style={s.dot} />
                          )
                        ) : null}
                      </View>
                    </Tap>
                    {last ? null : <View style={s.sep} />}
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}

      <Text style={s.foot}>
        Your dependency score is now {profile.score} out of 100.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  block: { marginTop: Spacing.five, gap: Spacing.two },
  question: { color: palette.text, fontSize: 17, lineHeight: 23, fontFamily: type.bodySemi },
  hint: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: -4 },
  card: { padding: 0, overflow: 'hidden', marginTop: Spacing.one },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
    paddingVertical: 14,
  },
  label: { flex: 1, color: palette.textDim, fontSize: 15, fontFamily: type.body },
  labelOn: { color: palette.text, fontFamily: type.bodySemi },
  check: { width: 15, height: 15 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.accent },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: Spacing.three },
  foot: {
    color: palette.textFaint,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: type.body,
    marginTop: Spacing.five,
  },
});

// Not reachable without an account and a subscription — see features/premium/access.
export default withAccess(AnswersScreen);
