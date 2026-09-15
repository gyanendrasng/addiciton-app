import { useEffect } from 'react';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

import { curves, durations } from '@/theme/motion';
import { palette } from '@/theme/palette';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The organ that habit wears on, drawn translucent, filling with green from
 * the bottom as the streak runs. One picture, one mechanic, every habit.
 *
 * The fill is how far along the organ's documented recovery the streak has
 * come (`recoveryFill` in timeline.ts) — a position on a published timeline,
 * not a measurement of anyone — and the card it sits on says nothing more
 * than the organ and the percentage. The milestones live on /recovery.
 */
export type Organ = 'lungs' | 'liver' | 'brain';

export function organFor(habitId: string): Organ {
  if (habitId === 'smoking' || habitId === 'vaping') return 'lungs';
  if (habitId === 'alcohol') return 'liver';
  return 'brain';
}

export const ORGAN_NAME: Record<Organ, string> = { lungs: 'Lungs', liver: 'Liver', brain: 'Brain' };

/**
 * The shapes are Health Icons' organs (healthicons.org, CC0 — drawn for the
 * WHO's public-health work, public domain, no attribution owed), on their own
 * 48-unit grid. `body` is what fills and takes the outline; `top`/`bottom`
 * are the body's extent, so a 50% fill is half the organ, whatever its
 * proportions.
 */
type Stroke = { d: string; w: number };
/** `body` fills and takes the outline; `detail` is drawn over it in both layers — the tree, the seams. */
type Shape = { body: string[]; detail: Stroke[]; box: number; top: number; bottom: number };

const SHAPES: Record<Organ, Shape> = {
  lungs: {
    // An original drawing on a 200-unit grid: larynx, ringed trachea, main
    // bronchi into each lung, three generations of branches, the fissures
    // that divide the lobes, an inner contour, and the cardiac notch.
    body: [
      'M90 6 C88 14 88 22 92 28 L108 28 C112 22 112 14 110 6 C104 4 96 4 90 6 Z',
      'M93 28 L107 28 L107 68 L93 68 Z',
      'M76 52 C60 52 44 68 36 92 C28 116 26 146 32 170 C36 186 50 194 66 192 C80 190 90 182 92 168 C96 146 94 118 92 96 C90 76 86 56 76 52 Z',
      'M124 52 C140 52 156 68 164 92 C172 116 174 146 168 170 C164 186 150 194 134 192 C120 190 110 182 108 168 C106 156 108 144 114 136 C108 126 104 114 106 100 C108 78 114 56 124 52 Z',
    ],
    detail: [
      { d: 'M100 68 C100 76 92 80 84 88', w: 4.2 },
      { d: 'M 100 68 C 100 76 108 80 116 88', w: 4.2 },
      { d: 'M84 88 C76 80 66 76 58 78', w: 2.6 },
      { d: 'M 116 88 C 124 80 134 76 142 78', w: 2.6 },
      { d: 'M66 77 C60 70 56 62 54 58', w: 1.7 },
      { d: 'M 134 77 C 140 70 144 62 146 58', w: 1.7 },
      { d: 'M66 77 C58 78 52 84 48 92', w: 1.7 },
      { d: 'M 134 77 C 142 78 148 84 152 92', w: 1.7 },
      { d: 'M58 78 C54 72 52 66 52 62', w: 1.1 },
      { d: 'M 142 78 C 146 72 148 66 148 62', w: 1.1 },
      { d: 'M84 88 C78 96 68 100 58 100', w: 2.6 },
      { d: 'M 116 88 C 122 96 132 100 142 100', w: 2.6 },
      { d: 'M62 100 C54 100 48 106 44 114', w: 1.7 },
      { d: 'M 138 100 C 146 100 152 106 156 114', w: 1.7 },
      { d: 'M62 100 C56 96 50 92 44 90', w: 1.7 },
      { d: 'M 138 100 C 144 96 150 92 156 90', w: 1.7 },
      { d: 'M44 114 C40 120 38 126 38 132', w: 1.1 },
      { d: 'M 156 114 C 160 120 162 126 162 132', w: 1.1 },
      { d: 'M84 88 C84 104 80 120 74 136', w: 2.6 },
      { d: 'M 116 88 C 116 104 120 120 126 136', w: 2.6 },
      { d: 'M78 112 C70 116 62 122 56 132', w: 1.7 },
      { d: 'M 122 112 C 130 116 138 122 144 132', w: 1.7 },
      { d: 'M78 112 C82 122 82 134 80 146', w: 1.7 },
      { d: 'M 122 112 C 118 122 118 134 120 146', w: 1.7 },
      { d: 'M74 136 C66 146 60 156 56 168', w: 1.7 },
      { d: 'M 126 136 C 134 146 140 156 144 168', w: 1.7 },
      { d: 'M74 136 C78 150 78 160 74 172', w: 1.7 },
      { d: 'M 126 136 C 122 150 122 160 126 172', w: 1.7 },
      { d: 'M56 132 C50 138 46 146 44 154', w: 1.1 },
      { d: 'M 144 132 C 150 138 154 146 156 154', w: 1.1 },
      { d: 'M80 146 C86 152 88 160 86 168', w: 1.1 },
      { d: 'M 120 146 C 114 152 112 160 114 168', w: 1.1 },
      { d: 'M56 168 C52 172 50 178 50 184', w: 1.1 },
      { d: 'M 144 168 C 148 172 150 178 150 184', w: 1.1 },
      { d: 'M34 118 C52 122 72 121 92 116', w: 1.2 },
      { d: 'M44 176 C60 156 78 134 92 108', w: 1.2 },
      { d: 'M156 176 C140 156 122 134 108 108', w: 1.2 },
      { d: 'M76 58 C62 58 48 72 41 94 C34 116 32 146 38 168', w: 0.9 },
      { d: 'M124 58 C138 58 152 72 159 94 C166 116 168 146 162 168', w: 0.9 },
      { d: 'M94 34 L106 34', w: 1.2 },
      { d: 'M94 40 L106 40', w: 1.2 },
      { d: 'M94 46 L106 46', w: 1.2 },
      { d: 'M94 52 L106 52', w: 1.2 },
      { d: 'M94 58 L106 58', w: 1.2 },
      { d: 'M94 64 L106 64', w: 1.2 },
      { d: 'M96 10 C98 16 102 16 104 10', w: 1.2 },
    ],
    box: 200,
    top: 6,
    bottom: 194,
  },
  liver: {
    // liver, the falciform ligament cut in
    body: [
      'M23.2157 10.0607C22.5621 11.0012 22.112 11.962 21.8034 12.8418C21.446 13.8608 21.2754 14.777 21.1939 15.4417C21.153 15.7748 21.1342 16.047 21.1257 16.2402C21.1214 16.3368 21.1197 16.4139 21.1192 16.4692C21.1189 16.4969 21.1189 16.5191 21.1189 16.5356L21.1191 16.556L21.1192 16.563L21.1193 16.5656L21.1193 16.5667C21.1193 16.5667 21.1193 16.5677 22.1191 16.5479C23.1189 16.528 23.1189 16.5288 23.1189 16.5288L23.1189 16.5255L23.1189 16.5227L23.1191 16.4903C23.1194 16.4562 23.1205 16.4015 23.1238 16.3282C23.1302 16.1815 23.1451 15.9615 23.179 15.6853C23.247 15.1312 23.3904 14.3599 23.6907 13.5039C24.0603 12.4502 24.6632 11.2773 25.6539 10.2157C27.9787 10.4791 28.8525 11.0046 29.5758 11.4395C30.2149 11.8238 30.7364 12.1374 32.0374 12.1374C33.3805 12.1374 35.2609 11.7362 37.1413 11.335C39.9619 10.7332 42.7825 10.1315 43.7898 10.8837C45.4687 12.1374 40.432 21.3314 35.3952 21.3314C32.8027 21.3314 31.2481 23.1899 29.7392 24.9937C28.3166 26.6944 26.9347 28.3464 24.762 28.3464C22.6699 28.3464 21.311 29.0047 20 29.7061V23.0479C20 22.6526 20.195 22.2841 20.5335 21.9879C20.8909 21.6752 21.2902 21.5479 21.5 21.5479V19.5479C20.7098 19.5479 19.8591 19.9205 19.2165 20.4828C18.5727 21.0461 18.0298 21.8962 18.0012 22.9597H12.9072C10.5179 22.9597 7.65082 24.0112 10.5179 26.1135C12.5977 27.6385 16.186 26.4249 18 25.6433V30.707C17.0781 31.0885 16.0352 31.3613 14.6885 31.3613C12.8526 31.3613 12.2458 32.8297 11.6009 34.3903C10.8697 36.1599 10.0895 38.0479 7.41312 38.0479C2.37634 38.0479 3.61914 22.5479 6.61916 16.5479C9.61919 10.5479 13.7245 10.0479 22.1192 10.0479C22.5059 10.0479 22.8709 10.0523 23.2157 10.0607Z',
    ],
    detail: [],
    box: 48,
    top: 7.7,
    bottom: 38.0,
  },
  brain: {
    // brain, its pathways cut in
    body: [
      'M29.5844 22.8706C30.7438 22.8706 31.8763 22.5549 32.8338 21.9648C33.806 22.5538 34.9534 22.8626 36.1242 22.8503L39.8433 21.6286C40.8913 20.8487 41.6107 19.7675 41.8813 18.5661C42.1518 17.3646 41.9569 16.1157 41.3293 15.0284C40.7017 13.9411 39.6794 13.0813 38.4336 12.5931C38.1491 11.4298 37.4326 10.3894 36.4029 9.64443L32.7725 8.49751H32.3638C31.5563 7.43391 30.344 6.67523 28.9574 6.36571L21.1741 5.9707C19.8803 6.06775 18.6603 6.55488 17.7105 7.35371C17.2617 7.25819 16.8023 7.20868 16.3412 7.20612C15.2247 7.20819 14.1327 7.50194 13.1971 8.05191C12.2615 8.60187 11.5222 9.38455 11.0685 10.3055L8.11115 12.1966C7.37528 13.0966 6.97913 14.1863 6.98108 15.305C6.9738 15.7727 7.04266 16.2389 7.18545 16.6886C6.40957 17.5975 5.99236 18.7143 6.00011 19.8617C5.99826 21.1925 6.56142 22.4733 7.57375 23.4407C7.65545 24.3934 8.02424 25.3079 8.64022 26.085C9.2562 26.8622 10.0959 27.4725 11.0685 27.8499C12.1891 28.4841 13.138 29.337 13.8453 30.3458C14.5527 31.3547 15.0005 32.4939 15.1559 33.6796H17.8743V25.9364L15.2325 23.5882L13.4451 25.3757C13.0545 25.7662 12.4214 25.7662 12.0308 25.3757C11.6403 24.9852 11.6403 24.352 12.0308 23.9615L14.1148 21.8775L13.4797 18.3848L10.6544 16.9721C10.1604 16.7251 9.96018 16.1244 10.2072 15.6304C10.4542 15.1365 11.0548 14.9362 11.5488 15.1832L14.3156 16.5666L17.7773 14.3638L16.7107 11.5197C16.5168 11.0026 16.7788 10.4262 17.2959 10.2322C17.813 10.0383 18.3895 10.3003 18.5834 10.8174L19.721 13.851H21.1199L21.7691 12.5526L20.8188 10.3352C20.6013 9.82758 20.8364 9.2397 21.344 9.02214C21.8517 8.80459 22.4396 9.03974 22.6571 9.54737L23.4829 11.4742L26.7826 12.0741C26.8011 12.0568 26.8204 12.0401 26.8405 12.0241L28.886 10.3877C29.3173 10.0427 29.9466 10.1126 30.2916 10.5439C30.6366 10.9751 30.5666 11.6044 30.1354 11.9494L28.6637 13.1268L30.3929 15.3499L31.0708 13.9941C31.2402 13.6553 31.5865 13.4413 31.9652 13.4413H34.4198C34.9721 13.4413 35.4198 13.889 35.4198 14.4413C35.4198 14.9936 34.9721 15.4413 34.4198 15.4413H32.5833L32.164 16.2799L34.2276 16.7384C34.3074 16.7562 34.3847 16.7836 34.4579 16.8202L36.0942 17.6384C36.5882 17.8854 36.7884 18.486 36.5415 18.98C36.2945 19.474 35.6938 19.6742 35.1998 19.4272L33.6736 18.6641L30.1119 17.8726C29.8848 17.8221 29.6823 17.694 29.5395 17.5104L26.9104 14.1301L23.6471 13.5368C23.5854 13.5943 23.5156 13.6446 23.4385 13.6859L22.7379 15.0871V15.8958H24.1925C24.3478 15.8958 24.5009 15.932 24.6397 16.0014L27.9125 17.6378C28.4064 17.8848 28.6067 18.4854 28.3597 18.9794C28.1127 19.4734 27.512 19.6736 27.018 19.4266L23.9564 17.8958H22.7379V19.7601C22.7379 20.3124 22.2902 20.7601 21.7379 20.7601C21.1856 20.7601 20.7379 20.3124 20.7379 19.7601V15.851H19.1655L15.4784 18.1973L16.1146 21.6964L19.5387 24.7399C19.7521 24.9297 19.8743 25.2017 19.8743 25.4873V33.6796H22.7915V28.145C22.7901 27.1624 23.0938 26.199 23.6682 25.3642C24.2425 24.5295 25.0645 23.8567 26.041 23.4222C26.5901 23.2326 26.7252 22.9773 26.8907 22.6645C27.001 22.456 27.1249 22.222 27.3937 21.9648C27.6273 22.1087 27.8082 22.2364 27.9652 22.347C28.4518 22.6901 28.7077 22.8706 29.5844 22.8706Z',
    ],
    detail: [],
    box: 48,
    top: 6.0,
    bottom: 35.4,
  },
};

/** The drawn bounds of a shape, from its body paths, so it can be centred by what's actually there. */
function boundsOf(shape: Shape) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of shape.body) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g) ?? [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = Number(nums[i]), y = Number(nums[i + 1]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}
const CENTRE: Record<Organ, { dx: number; dy: number }> = Object.fromEntries(
  (Object.keys(SHAPES) as Organ[]).map((k) => {
    const { cx, cy } = boundsOf(SHAPES[k]);
    return [k, { dx: SHAPES[k].box / 2 - cx, dy: SHAPES[k].box / 2 - cy }];
  }),
) as Record<Organ, { dx: number; dy: number }>;

/**
 * The drawing on its own. Two organs, one over the other: a grey one — grey
 * body, grey outline — and a green one clipped to the level, so everything
 * still to come is grey and only what's done is green, outline included.
 * The level's top edge is a soft meniscus, not a flat cut, and it rises once
 * on mount, after the screen has settled.
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

  const { dx, dy } = CENTRE[organ];
  const levelPath = useAnimatedProps(() => {
    const y = shape.bottom - (shape.bottom - shape.top) * level.get() + dy;
    const b = shape.box;
    const a = b / 48; // the meniscus in the shape's own units
    // A liquid's surface: two shallow curves across the width, then down and around.
    return {
      d: `M ${-2 * a} ${y + 0.5 * a} C ${10 * a} ${y - 0.7 * a} ${17 * a} ${y + a} ${24 * a} ${y} C ${31 * a} ${y - a} ${38 * a} ${y + 0.7 * a} ${50 * a} ${y + 0.3 * a} V ${b + 2 * a} H ${-2 * a} Z`,
    };
  });
  const k = shape.box / 48; // stroke widths were tuned on the 48 grid

  const clipId = `level-${organ}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${shape.box} ${shape.box}`}>
      <Defs>
        <ClipPath id={clipId}>
          <AnimatedPath animatedProps={levelPath} />
        </ClipPath>
      </Defs>
      <G transform={`translate(${dx} ${dy})`}>
      {/* what's still to come */}
      <G fill={palette.surface3} stroke={palette.line} strokeWidth={0.6 * k} strokeLinejoin="round">
        {shape.body.map((d, i) => (
          <Path key={`g${i}`} d={d} fillRule="evenodd" />
        ))}
      </G>
      <G fill="none" stroke={palette.textFaint} strokeLinecap="round" strokeLinejoin="round" opacity={0.35}>
        {shape.detail.map((t, i) => (
          <Path key={`gd${i}`} d={t.d} strokeWidth={t.w} />
        ))}
      </G>
      {/* what's done */}
      <G clipPath={`url(#${clipId})`}>
        <G fill={palette.accent} stroke={palette.accent} strokeWidth={0.6 * k} strokeLinejoin="round">
          {shape.body.map((d, i) => (
            <Path key={`a${i}`} d={d} fillRule="evenodd" />
          ))}
        </G>
        <G fill="none" stroke={palette.accentDeep} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
          {shape.detail.map((t, i) => (
            <Path key={`ad${i}`} d={t.d} strokeWidth={t.w} />
          ))}
        </G>
      </G>
      </G>
    </Svg>
  );
}
