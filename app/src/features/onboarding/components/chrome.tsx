/** Shared flow chrome: step transitions, progress bar, shell, CTA button. */
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
} from 'react-native-reanimated';

import Svg, { Path as SvgPath } from 'react-native-svg';

import { Tap } from '@/components/ui/tap';
import { Spacing } from '@/theme/spacing';
import { curves, durations, springs } from '@/theme/motion';
import { type } from '@/theme/type';
import { palette } from '@/theme/palette';

/** Direction-aware step swap: enter x ±110%, exit opposite; spring move, bounce 0. */
export function makeStepTransitions(width: number, direction: 1 | -1, reduced: boolean) {
  if (reduced) {
    const enter = () => {
      'worklet';
      return {
        initialValues: { opacity: 0 },
        animations: { opacity: withTiming(1, { duration: durations.fast, easing: curves.fade }) },
      };
    };
    const exit = () => {
      'worklet';
      return {
        initialValues: { opacity: 1 },
        animations: { opacity: withTiming(0, { duration: durations.press, easing: curves.fade }) },
      };
    };
    return { entering: enter, exiting: exit };
  }
  if (Platform.OS === 'web') {
    // Web build of Reanimated only supports predefined enter/exit animations.
    return direction === 1
      ? { entering: SlideInRight.duration(durations.base), exiting: SlideOutLeft.duration(durations.fast) }
      : { entering: SlideInLeft.duration(durations.base), exiting: SlideOutRight.duration(durations.fast) };
  }
  const off = width * 1.1 * direction;
  const entering = (_v: EntryAnimationsValues) => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateX: off }] },
      animations: {
        opacity: withSpring(1, springs.move),
        transform: [{ translateX: withSpring(0, springs.move) }],
      },
    };
  };
  const exiting = (_v: ExitAnimationsValues) => {
    'worklet';
    return {
      initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
      animations: {
        opacity: withTiming(0, { duration: durations.fast, easing: curves.out }),
        transform: [{ translateX: withTiming(-off, { duration: durations.fast, easing: curves.out }) }],
      },
    };
  };
  return { entering, exiting };
}

export function StepFrame({
  stepKey,
  direction,
  children,
}: {
  stepKey: string;
  direction: 1 | -1;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const t = makeStepTransitions(width, direction, reduced);
  return (
    <Animated.View key={stepKey} entering={t.entering} exiting={t.exiting} style={styles.frame}>
      {children}
    </Animated.View>
  );
}

function Segment({ state }: { state: 'done' | 'current' | 'todo' }) {
  const fill = useAnimatedStyle(() => ({
    width: withTiming(state === 'done' ? '100%' : state === 'current' ? '45%' : '0%', {
      duration: durations.base,
      easing: curves.out,
    }),
  }));
  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.segmentFill, fill]} />
    </View>
  );
}

/** Segmented quiz progress: one segment per question, current one part-filled. */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={`Question ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Segment key={i} state={i < current - 1 ? 'done' : i === current - 1 ? 'current' : 'todo'} />
      ))}
    </View>
  );
}

export function Chevron({ size = 20 }: { size?: number }) {
  return (
    <View style={styles.backChip}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <SvgPath
          d="M14.5 5.5 L8 12 L14.5 18.5"
          stroke={palette.text}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <Text style={[styles.eyebrow, center && styles.center]}>{children}</Text>;
}

export function Title({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <Text style={[styles.title, center && styles.center]}>{children}</Text>;
}

export function Subtitle({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <Text style={[styles.subtitle, center && styles.center]}>{children}</Text>;
}

export function Cta({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Tap
      haptic={disabled ? 'none' : 'light'}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.cta, variant === 'ghost' && styles.ctaGhost, disabled && styles.ctaDisabled]}>
      <Text style={[styles.ctaLabel, variant === 'ghost' && styles.ctaGhostLabel]}>{label}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, paddingHorizontal: Spacing.four },
  track: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.surface3,
    overflow: 'hidden',
  },
  segmentFill: { height: 4, borderRadius: 2, backgroundColor: palette.accent },
  center: { textAlign: 'center' },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface3,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    fontFamily: type.display,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: type.bodySemi,
    marginBottom: Spacing.two,
  },
  subtitle: { color: palette.textDim, fontSize: 15, lineHeight: 22, marginTop: Spacing.two + 2, fontFamily: type.body },
  cta: {
    backgroundColor: palette.accent,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.35 },
  ctaGhost: { backgroundColor: 'transparent' },
  ctaLabel: { color: palette.accentInk, fontSize: 16, fontFamily: type.bodySemi },
  ctaGhostLabel: { color: palette.textDim, fontFamily: type.bodyMed },
});
