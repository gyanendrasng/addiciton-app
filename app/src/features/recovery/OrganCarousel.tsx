import { StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { OrganPicture, type Organ } from './OrganFill';

export type OrganSlide = {
  id: string;
  organ: Organ;
  name: string;
  /** the habit, shown only when there's more than one */
  caption?: string;
  /** 0–1 along the organ's documented recovery */
  progress: number;
};

/**
 * The card is exactly the width of the urge button beneath it, on the page's
 * own margins, and there is no gap between cards: the neighbours show in the
 * full 24pt margin, their slight scale-down making the seam, and a hairline
 * edge so the inset reads as a card and not a strip.
 */
const GAP = 0;

/**
 * One organ at a time, the neighbours peeking in at both edges, dots beneath.
 *
 * It wraps: the last card peeks in on the left of the first, and a swipe
 * past either end comes round to the other. Done the plain way — a copy of
 * the last slide before the first and of the first after the last, and a
 * silent jump back into the real run when the scroll settles on a copy.
 *
 * Scroll is the finger's, 1:1; the slide that isn't centred steps back to
 * 0.92 and dims, and the snap settles with the platform's own deceleration.
 * The picture carries the message — the words are the organ and the number,
 * and the rest lives on /recovery, which a tap opens for that habit.
 */
export function OrganCarousel({ slides, onOpen }: { slides: OrganSlide[]; onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const many = slides.length > 1;
  const slideWidth = width - Spacing.four * 2;
  const step = slideWidth + GAP;
  const sidePad = Spacing.four;
  const n = slides.length;
  // The run on screen: [last, ...slides, first]; the real cards sit at 1…n.
  const run = many ? [slides[n - 1], ...slides, slides[0]] : slides;
  const x = useSharedValue(many ? step : 0);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.set(e.contentOffset.x);
  });

  // Settled on a copy: jump to its real twin without anyone seeing.
  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!many) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    if (i === 0) ref.current?.scrollTo({ x: n * step, animated: false });
    else if (i === n + 1) ref.current?.scrollTo({ x: step, animated: false });
  };

  return (
    <View style={s.bleed}>
      <Animated.ScrollView
        ref={ref}
        horizontal
        scrollEnabled={many}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        disableIntervalMomentum
        contentOffset={{ x: many ? step : 0, y: 0 }}
        onScroll={onScroll}
        onMomentumScrollEnd={onSettle}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}>
        {run.map((slide, i) => (
          <Slide key={`${i}-${slide.id}`} slide={slide} index={i} step={step} width={slideWidth} x={x} reduced={reduced} many={many} onOpen={onOpen} />
        ))}
      </Animated.ScrollView>
      {many ? (
        <View style={s.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {slides.map((slide, i) => (
            <Dot key={slide.id} index={i} count={n} step={step} x={x} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Slide({
  slide,
  index,
  step,
  width,
  x,
  reduced,
  many,
  onOpen,
}: {
  slide: OrganSlide;
  index: number;
  step: number;
  width: number;
  x: SharedValue<number>;
  reduced: boolean;
  many: boolean;
  onOpen: (id: string) => void;
}) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * step, index * step, (index + 1) * step];
    return {
      opacity: interpolate(x.get(), range, [0.7, 1, 0.7], Extrapolation.CLAMP),
      transform: [{ scale: reduced ? 1 : interpolate(x.get(), range, [0.96, 1, 0.96], Extrapolation.CLAMP) }],
    };
  });
  const pct = Math.round(slide.progress * 100);
  const peeking = many;
  // The picture is the card: it fills the height, anchored left, and the
  // words sit as one right-aligned cluster in the bottom-right corner.
  const height = Math.round(width * 0.66);
  const art = Math.round(height * 1.08);

  return (
    <Animated.View style={[{ width }, style]}>
      <Tap
        haptic="light"
        onPress={() => onOpen(slide.id)}
        style={[s.card, { height }, peeking && s.cardPeek]}
        accessibilityRole="button"
        accessibilityLabel={`${slide.name}${slide.caption ? `, ${slide.caption}` : ''}, ${pct} percent of the way through recovery. See your recovery.`}>
        <View pointerEvents="none" style={[s.art, { left: Spacing.two, top: Math.round((height - art) / 2) }]}>
          <OrganPicture organ={slide.organ} progress={slide.progress} size={art} />
        </View>
        <View style={s.words}>
          <Text style={s.pct}>{pct}%</Text>
          <Text style={s.name}>{slide.name}</Text>
          {slide.caption ? <Text style={s.caption}>{slide.caption}</Text> : null}
        </View>
      </Tap>
    </Animated.View>
  );
}

/** A dot lights for its card — and for that card's copy at the far end, so the wrap never blanks it. */
function Dot({ index, count, step, x }: { index: number; count: number; step: number; x: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const centres = [(index + 1) * step];
    if (index === count - 1) centres.push(0);
    if (index === 0) centres.push((count + 1) * step);
    let d = Infinity;
    for (const c of centres) d = Math.min(d, Math.abs(x.get() - c));
    return {
      width: interpolate(d, [0, step], [18, 6], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(d, [0, step], [palette.accent, palette.line]),
    };
  });
  return <Animated.View style={[s.dot, style]} />;
}

const s = StyleSheet.create({
  // The page pads by Spacing.four; the carousel takes the whole width so the peeks reach the edges.
  bleed: { marginHorizontal: -Spacing.four, gap: Spacing.three },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  // In a run of cards, a hairline so the inset of a neighbour reads as an edge.
  cardPeek: { borderWidth: 1, borderColor: palette.line },
  art: { position: 'absolute' },
  words: { position: 'absolute', right: Spacing.three, bottom: Spacing.three, alignItems: 'flex-end', maxWidth: '42%' },
  pct: { color: palette.accent, fontSize: 36, lineHeight: 40, fontFamily: type.display, fontVariant: ['tabular-nums'], letterSpacing: -0.8 },
  name: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi, marginTop: 2 },
  caption: { color: palette.textDim, fontSize: 13, fontFamily: type.body, textAlign: 'right' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
