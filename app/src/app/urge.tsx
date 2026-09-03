import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useReducer, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tap } from '@/components/ui/tap';
import { finishUrge, insertUrge } from '@/db/repo/urges';
import { ORDER, urgeReducer, type UrgeStep } from '@/features/urge/machine';
import { StepDots } from '@/features/urge/screens/shared';
import { Breathe } from '@/features/urge/screens/Breathe';
import { Delay } from '@/features/urge/screens/Delay';
import { Game } from '@/features/urge/screens/Game';
import { Outcome } from '@/features/urge/screens/Outcome';
import { Reasons } from '@/features/urge/screens/Reasons';
import { now } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { useDismiss } from '@/lib/nav';

export default function UrgeScreen() {
  const router = useRouter();
  const dismiss = useDismiss();
  const navigation = useNavigation();
  const [state, dispatch] = useReducer(urgeReducer, { step: 'breathe' as UrgeStep, completed: [], startedAt: now() });
  const urgeId = useRef<number | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    insertUrge().then((id) => {
      urgeId.current = id;
    });
  }, []);

  // Closing without an outcome = abandoned (still useful data)
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', () => {
      if (finished.current || urgeId.current == null) return;
      finished.current = true;
      finishUrge(urgeId.current, {
        outcome: 'abandoned',
        durationS: Math.round((now() - state.startedAt) / 1000),
        stepsCompleted: state.completed,
      });
    });
    return sub;
  }, [navigation, state.completed, state.startedAt]);

  const finish = async (outcome: 'survived' | 'slipped', d: { trigger: string | null; intensity: number | null }) => {
    if (finished.current) return;
    finished.current = true;
    const id = urgeId.current;
    if (id != null) {
      await finishUrge(id, {
        outcome,
        trigger: d.trigger,
        intensity: d.intensity,
        durationS: Math.round((now() - state.startedAt) / 1000),
        stepsCompleted: state.completed,
      });
    }
    if (outcome === 'slipped') router.replace({ pathname: '/relapse', params: { urgeId: id ?? '' } });
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const next = (completed: boolean) => dispatch({ type: 'next', completed });
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.header}>
        <Tap haptic="none" onPress={dismiss} style={s.close} accessibilityLabel="Close">
          <Text style={s.closeGlyph}>×</Text>
        </Tap>
      </View>
      <Animated.View
        key={state.step}
        entering={FadeIn.duration(durations.base)}
        exiting={FadeOut.duration(durations.fast)}
        style={{ flex: 1 }}>
        {state.step === 'breathe' && <Breathe onDone={() => next(true)} onSkip={() => next(false)} />}
        {state.step === 'delay' && (
          <Delay onDone={() => next(true)} onSkip={() => next(false)} onBreatheAgain={() => dispatch({ type: 'goto', step: 'breathe' })} />
        )}
        {state.step === 'reasons' && <Reasons onDone={() => next(true)} />}
        {state.step === 'game' && <Game onDone={() => next(true)} onSkip={() => next(false)} />}
        {state.step === 'outcome' && <Outcome onSurvived={(d) => finish('survived', d)} onSlipped={(d) => finish('slipped', d)} />}
      </Animated.View>
      <StepDots index={ORDER.indexOf(state.step)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: { height: 56, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: Spacing.four },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface3,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: { color: palette.text, fontSize: 22, fontFamily: type.body, lineHeight: 24 },
});
