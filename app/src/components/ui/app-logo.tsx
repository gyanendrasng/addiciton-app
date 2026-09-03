import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { curves, durations, springs } from '@/theme/motion';

/**
 * The Curb mark: two chain links snapping apart.
 *
 * Two colours, not one — the link you're breaking away from is ember, the one
 * that's already free is mint. A single flat green tile read as a placeholder;
 * the two-tone break is what makes the mark say something.
 *
 * These are BRAND colours, deliberately hard-coded rather than pulled from the
 * palette: a logo must look identical in light and dark, and identical to the
 * store icon in `brand/`.
 */
const BRAND = {
  tile: '#0E1113',
  edge: 'rgba(255,255,255,0.10)',
  /** the link that's free */
  free: '#31C983',
  /** the link being left behind */
  held: '#FF8A4C',
} as const;

/** The two arcs, as solved from the store icon's geometry. */
const LINKS = {
  free: 'M 516.1 663.0 A 138 138 0 1 1 364.0 481.8',
  held: 'M 507.9 361.0 A 138 138 0 1 1 660.0 542.2',
} as const;

/**
 * Unit vector from the lower-left link toward the upper-right one — the axis
 * the chain breaks along. Used so the two halves separate along their own
 * diagonal rather than sliding in some arbitrary direction.
 */
const AXIS = { x: 0.77, y: -0.64 };

function Link({ which, size }: { which: keyof typeof LINKS; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
      <Path
        d={LINKS[which]}
        stroke={BRAND[which]}
        strokeWidth={88}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function AppLogo({
  size = 96,
  tile = true,
  /**
   * Play the break once on mount. Reserved for hero moments — the animation
   * skill allows one per screen, and a mark that snaps apart every time it
   * appears in a settings row would be noise.
   */
  animate = false,
}: {
  size?: number;
  tile?: boolean;
  animate?: boolean;
}) {
  const inner = Math.round(size * (tile ? 0.74 : 1));
  const reduced = useReducedMotion();

  // 1 = joined (pulled toward each other), 0 = at rest, apart.
  const joined = useSharedValue(animate ? 1 : 0);
  const fade = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    if (reduced) {
      // Reduced motion still gets the mark, just without the movement.
      fade.set(withTiming(1, { duration: durations.base, easing: curves.fade }));
      joined.set(0);
      return;
    }
    fade.set(withTiming(1, { duration: durations.fast, easing: curves.out }));
    // A beat of stillness first, so the break reads as an event rather than
    // as the screen finishing loading.
    joined.set(withDelay(160, withSpring(0, springs.hero)));
  }, [animate, fade, joined, reduced]);

  const travel = inner * 0.13;
  const freeStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [
      { translateX: joined.get() * travel * AXIS.x },
      { translateY: joined.get() * travel * AXIS.y },
      { rotate: `${joined.get() * 7}deg` },
    ],
  }));
  const heldStyle = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [
      { translateX: joined.get() * -travel * AXIS.x },
      { translateY: joined.get() * -travel * AXIS.y },
      { rotate: `${joined.get() * -7}deg` },
    ],
  }));

  const links = (
    <View style={{ width: inner, height: inner }}>
      <Animated.View style={[StyleSheet.absoluteFill, freeStyle]}>
        <Link which="free" size={inner} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, heldStyle]}>
        <Link which="held" size={inner} />
      </Animated.View>
    </View>
  );

  if (!tile) return <View style={{ width: size, height: size }}>{links}</View>;

  return (
    <View
      style={[
        s.tile,
        { width: size, height: size, borderRadius: size * 0.28, borderWidth: size > 40 ? 1 : 0 },
      ]}>
      {links}
    </View>
  );
}

const s = StyleSheet.create({
  tile: {
    backgroundColor: BRAND.tile,
    borderColor: BRAND.edge,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
