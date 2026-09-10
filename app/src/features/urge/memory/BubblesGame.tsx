import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const STAGE = 300;
const POPS = 12;
const LIFE_MS = 1700;
const HUES = ['checkin', 'pledge', 'urge', 'reasons', 'progress'] as const;

type Bubble = { key: number; x: number; y: number; size: number; hue: (typeof HUES)[number] };

function spawn(key: number): Bubble {
  const size = 48 + Math.floor(Math.random() * 24);
  return {
    key,
    size,
    x: Math.random() * (STAGE - size),
    y: Math.random() * (STAGE - size),
    hue: HUES[key % HUES.length],
  };
}

/**
 * One bubble at a time appears somewhere on the stage and shrinks away; tap it
 * before it goes. A miss just brings the next one — there is no score to lose,
 * only the count of pops climbing to twelve. Physical, a little silly, and
 * absorbing enough to take the edge off a minute.
 */
export function BubblesGame({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [bubble, setBubble] = useState<Bubble>(() => spawn(0));
  const [pops, setPops] = useState(0);
  const scale = useSharedValue(1);
  const alive = useRef(true);

  const next = useCallback(() => {
    if (!alive.current) return;
    setBubble((b) => spawn(b.key + 1));
  }, []);

  // Each bubble lives for LIFE_MS, shrinking on the UI thread; when the timer
  // runs out unpopped, the next one arrives.
  useEffect(() => {
    scale.set(1);
    if (reduced) return; // stays until tapped
    scale.set(
      withTiming(0.25, { duration: LIFE_MS, easing: curves.linear }, (finished) => {
        if (finished) runOnJS(next)();
      }),
    );
    return () => cancelAnimation(scale);
  }, [bubble.key, next, reduced, scale]);

  useEffect(() => {
    return () => {
      alive.current = false;
    };
  }, []);

  const pop = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    cancelAnimation(scale);
    const n = pops + 1;
    setPops(n);
    if (n >= POPS) {
      alive.current = false;
      setTimeout(onDone, 250);
      return;
    }
    next();
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <View style={s.wrap}>
      <View style={s.stage}>
        <Animated.View
          key={bubble.key}
          style={[
            s.bubble,
            {
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              backgroundColor: hues[bubble.hue].solid,
            },
            style,
          ]}>
          {/* The whole bubble, plus a margin, is the hit target — it shrinks, the target doesn't. */}
          <Pressable
            onPress={pop}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Pop the bubble"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={s.round}>
        {pops} of {POPS} popped
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.three },
  stage: {
    width: STAGE,
    height: STAGE,
    borderRadius: 24,
    backgroundColor: palette.surface2,
    overflow: 'hidden',
  },
  bubble: { position: 'absolute' },
  round: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodyMed, fontVariant: ['tabular-nums'] },
});
