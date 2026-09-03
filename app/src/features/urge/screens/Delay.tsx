import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { curves } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';
import { SKIP_AFTER_MS } from '../machine';
import { shared, SkipLater, StepHeader } from './shared';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TOTAL_S = 120;
const SIZE = 220;
const R = SIZE / 2 - 10;
const CIRC = 2 * Math.PI * R;

/** Two-minute delay. Urges peak and pass; the ring is linear because it's a clock. */
export function Delay({ onDone, onSkip, onBreatheAgain }: { onDone: () => void; onSkip: () => void; onBreatheAgain: () => void }) {
  const reduced = useReducedMotion();
  const [left, setLeft] = useState(TOTAL_S);
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withTiming(1, { duration: TOTAL_S * 1000, easing: curves.linear }));
    const start = Date.now();
    const id = setInterval(() => {
      const remain = Math.max(0, TOTAL_S - Math.floor((Date.now() - start) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(id);
        onDone();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ring = useAnimatedProps(() => ({ strokeDashoffset: reduced ? 0 : CIRC * (1 - p.get()) }));
  const mm = String(Math.floor(left / 60));
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View style={shared.pane}>
      <StepHeader center kicker="Step 2 · Wait it out" title="Urges peak, then pass." />
      <View style={shared.center}>
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={palette.surface3} strokeWidth={10} fill="none" />
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={palette.accent}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              animatedProps={ring}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <View style={s.center}>
            <Text style={s.time}>
              {mm}:{ss}
            </Text>
            <Text style={s.sub}>nothing to decide yet</Text>
          </View>
        </View>
        <Text style={s.copy}>Two minutes is usually all it takes for the wave to break.</Text>
        <Tap haptic="none" onPress={onBreatheAgain} style={s.again}>
          <Text style={s.againLabel}>Breathe again</Text>
        </Tap>
      </View>
      <SkipLater afterMs={SKIP_AFTER_MS.delay} onSkip={onSkip} />
    </View>
  );
}

const s = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  time: { color: palette.bright, fontSize: 60, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -1.5 },
  sub: { color: palette.textFaint, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  copy: { marginTop: 28, color: palette.textDim, fontSize: 15, fontFamily: type.body, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  again: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: palette.line },
  againLabel: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi },
});
