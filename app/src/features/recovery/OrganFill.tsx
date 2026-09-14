import { useEffect } from 'react';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import { curves, durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The organ that habit wears on, drawn translucent, filling with green from
 * the bottom as the streak runs. One picture, one mechanic, every habit.
 *
 * The fill is progress through the 90-day program — the same number as
 * "Day 12 of 90" — not a measurement of anything, and the card it sits on
 * says nothing more than the organ and the percentage. The documented
 * milestones live on /recovery, one tap away.
 */
export type Organ = 'lungs' | 'liver' | 'brain';

export function organFor(habitId: string): Organ {
  if (habitId === 'smoking' || habitId === 'vaping') return 'lungs';
  if (habitId === 'alcohol') return 'liver';
  return 'brain';
}

export const ORGAN_NAME: Record<Organ, string> = { lungs: 'Lungs', liver: 'Liver', brain: 'Brain' };

/**
 * Anatomy on a 200 × 200 canvas.
 *
 * `body` is what fills and takes the outline; `detail` is drawn over it at
 * reduced opacity — fissures, ligaments, gyri, the things that make an organ
 * read as itself rather than a shape. `top`/`bottom` are the body's extent,
 * so a 50% fill is half the organ, whatever its proportions.
 */
type Shape = {
  body: string[];
  /** structure first (tubes, ligaments), seams after `seamFrom` (fissures, gyri) — drawn lighter */
  detail: string[];
  seamFrom: number;
  top: number;
  bottom: number;
};

const SHAPES: Record<Organ, Shape> = {
  lungs: {
    body: [
      // right lung (viewer's left): rounded apex, full outer wall, concave base, medial wall up to the hilum
      'M84 62 C72 60 58 72 50 88 C40 108 34 136 34 160 C34 176 40 186 52 188 C64 190 78 190 88 182 C96 174 98 150 98 122 C98 100 96 78 84 62 Z',
      // left lung, with the cardiac notch bitten out of its medial side
      'M116 62 C128 60 142 72 150 88 C160 108 166 136 166 160 C166 176 160 186 148 188 C136 190 122 190 112 182 C104 174 106 160 112 150 C104 138 100 124 102 110 C104 96 106 78 116 62 Z',
      // trachea, down to the carina
      'M94 12 h12 v48 h-12 Z',
    ],
    detail: [
      // cartilage rings
      'M95 20 h10',
      'M95 28 h10',
      'M95 36 h10',
      'M95 44 h10',
      'M95 52 h10',
      // main bronchi, tapering into each lung
      'M100 60 C100 68 94 74 86 80',
      'M100 60 C100 68 106 74 114 80',
      // the branches inside, thinning as they go
      'M86 80 C78 88 70 100 66 116',
      'M86 80 C88 92 90 106 90 124',
      'M66 116 C62 124 58 132 56 142',
      'M114 80 C122 88 130 100 134 116',
      'M114 80 C112 92 110 106 110 124',
      'M134 116 C138 124 142 132 144 142',
      // fissures: right horizontal and oblique, left oblique — curved, as they are
      'M38 128 C58 131 78 129 97 124',
      'M52 180 C66 160 82 140 96 112',
      'M148 180 C134 160 118 140 106 112',
    ],
    seamFrom: 13,
    top: 12,
    bottom: 190,
  },
  liver: {
    body: [
      // anterior view: the tall, rounded right lobe on the viewer's left, a dome along the top,
      // the thin left lobe tapering to a point on the right, a long diagonal inferior edge back
      'M28 84 C30 62 56 46 96 44 C124 43 152 50 172 64 C180 70 182 80 176 86 C150 104 110 130 74 148 C60 155 46 152 38 138 C30 124 27 100 28 84 Z',
    ],
    detail: [
      // falciform ligament, top to the notch on the lower edge
      'M114 46 C120 76 118 108 100 138',
      // gallbladder, peeking from under the right lobe
      'M62 148 C60 158 66 166 76 166 C86 166 92 158 88 150',
    ],
    seamFrom: 1,
    top: 44,
    bottom: 154,
  },
  brain: {
    body: [
      // cerebrum, lateral view: frontal lobe on the viewer's left, occipital on the right
      'M34 108 C30 76 56 48 96 44 C134 40 168 56 174 90 C178 112 168 132 150 140 C140 148 124 150 112 146 C102 150 90 150 82 142 C64 146 44 136 36 122 C34 118 34 112 34 108 Z',
      // cerebellum, tucked under the occipital lobe
      'M114 146 C120 160 140 168 158 160 C170 154 172 138 162 132 C152 144 134 150 114 146 Z',
      // brainstem, narrowing as it goes down
      'M94 148 C94 158 95 168 97 178 C99 181 101 181 103 178 C105 168 106 158 106 148 Z',
    ],
    detail: [
      // lateral (Sylvian) fissure
      'M60 116 C82 104 108 100 138 108',
      // central sulcus
      'M100 46 C104 66 102 86 96 102',
      // gyri, frontal
      'M52 90 C62 76 80 68 96 72',
      'M46 108 C56 96 70 92 84 96',
      // gyri, parietal and occipital
      'M112 56 C130 54 150 62 160 78',
      'M120 82 C136 78 154 86 164 100',
      'M130 122 C142 116 156 118 164 126',
      // temporal lobe
      'M64 128 C80 120 100 122 116 132',
      // folia on the cerebellum
      'M124 150 C136 152 148 150 156 146',
      'M128 156 C138 158 148 156 154 152',
    ],
    seamFrom: 0,
    top: 42,
    bottom: 184,
  },
};

/**
 * The drawing on its own: a translucent organ with `progress` (0–1) of it
 * filled green from the bottom, the top of the fill a soft meniscus rather
 * than a flat cut. Rises once on mount, after the screen has settled.
 */
export function OrganPicture({ organ, progress, size, animate = true }: { organ: Organ; progress: number; size: number; animate?: boolean }) {
  const reduced = useReducedMotion();
  const level = useSharedValue(animate && !reduced ? 0 : progress);
  const shape = SHAPES[organ];

  useEffect(() => {
    if (reduced || !animate) {
      level.set(progress);
      return;
    }
    level.set(withDelay(durations.base, withTiming(progress, { duration: durations.reveal, easing: curves.out })));
  }, [animate, level, progress, reduced]);

  const fill = useAnimatedProps(() => {
    const y = shape.bottom - (shape.bottom - shape.top) * level.get();
    // A liquid's surface: two shallow curves across the width, then down and around.
    return { d: `M -10 ${y + 2} C 40 ${y - 3} 70 ${y + 4} 100 ${y} C 130 ${y - 4} 160 ${y + 3} 210 ${y + 1} V 210 H -10 Z` };
  });

  const clipId = `organ-${organ}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <ClipPath id={clipId}>
          {shape.body.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </ClipPath>
      </Defs>
      <G>
        {shape.body.map((d, i) => (
          <Path key={i} d={d} fill={hues.pledge.wash} />
        ))}
      </G>
      <AnimatedPath fill={palette.accent} clipPath={`url(#${clipId})`} animatedProps={fill} />
      <G fill="none" stroke={palette.accent} strokeLinecap="round" strokeLinejoin="round">
        {shape.detail.map((d, i) => (
          <Path key={`d${i}`} d={d} strokeWidth={i < shape.seamFrom ? 2.25 : 1.5} opacity={i < shape.seamFrom ? 0.75 : 0.45} />
        ))}
        {shape.body.map((d, i) => (
          <Path key={`o${i}`} d={d} strokeWidth={2.5} />
        ))}
      </G>
    </Svg>
  );
}
