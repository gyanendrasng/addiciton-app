import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { curves, springs } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.View;

/** A flat shield, drawn rather than borrowed, so it is the same on every platform and theme. */
const SHIELD = 'M32 5 L55 13.5 V30 C55 44.5 45 55 32 59.5 C19 55 9 44.5 9 30 V13.5 Z';

/**
 * The status mark. Filled in the urge hue when the shield is up, an outline
 * in `textFaint` when it is down; a thin ring around it fills to show how much
 * of a timed lock or window is left. The flip between states is the one hero
 * motion on the screen — a small settle, not a celebration.
 */
export function ShieldMark({
  up,
  /** 0..1 of the current lock or window remaining; omit for none */
  remaining,
  size = 128,
}: {
  up: boolean;
  remaining?: number;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const fill = useSharedValue(remaining ?? 0);
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (reduced) return;
    scale.set(0.92);
    scale.set(withSpring(1, springs.hero));
  }, [up, reduced, scale]);

  useEffect(() => {
    const target = remaining ?? 0;
    fill.set(reduced ? target : withTiming(target, { duration: 900, easing: curves.out }));
  }, [fill, reduced, remaining]);

  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - fill.get()) }));

  const inner = size * 0.5;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.surface3} strokeWidth={4} fill="none" />
        {remaining !== undefined ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={hues.urge.solid}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            animatedProps={ringProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <AnimatedView style={[s.center, markStyle]}>
        <Svg width={inner} height={inner} viewBox="0 0 64 64">
          <Path
            d={SHIELD}
            fill={up ? hues.urge.solid : 'none'}
            stroke={up ? 'none' : palette.textFaint}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          {up ? (
            <Path d="M22 33 L29 40 L43 25" stroke={hues.urge.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : null}
        </Svg>
      </AnimatedView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
