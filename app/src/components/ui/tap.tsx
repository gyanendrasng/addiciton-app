import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { springs } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TapProps = PressableProps & {
  /** press-scale target; default 0.97 per motion standards */
  pressScale?: number;
  /** haptic on press-in: 'selection' | 'light' | 'medium' | 'none' */
  haptic?: 'selection' | 'light' | 'medium' | 'none';
};

function fireHaptic(kind: NonNullable<TapProps['haptic']>) {
  try {
    if (kind === 'selection') Haptics.selectionAsync();
    else if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // haptics unavailable (web/simulator) — motion still carries the feedback
  }
}

/**
 * The one Pressable for the whole app: scale 1 → 0.97 with the press spring,
 * interruptible, ≥44pt hit target via hitSlop when the target is small.
 */
export const Tap = forwardRef<View, TapProps>(function Tap(
  { pressScale = 0.97, haptic = 'selection', onPressIn, onPressOut, style, ...rest },
  ref,
) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      if (!reduced) scale.value = withSpring(pressScale, springs.press);
      if (haptic !== 'none') fireHaptic(haptic);
      onPressIn?.(e);
    },
    [haptic, onPressIn, pressScale, reduced, scale],
  );

  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      scale.value = withSpring(1, springs.press);
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <AnimatedPressable
      ref={ref}
      hitSlop={8}
      {...rest}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[style as object, animatedStyle]}
    />
  );
});
