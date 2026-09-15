import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { curves, durations } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { ORGAN_ART, type OrganArt } from './organ-art';

/**
 * The organ that habit wears on, filling with green from the bottom as its
 * recovery progresses. Two copies of the same illustration, one over the
 * other: a grey one underneath, a green one on top clipped to the level —
 * so everything still to come is grey, shading and outline included, and
 * only what's done is green.
 *
 * The illustrations are medical art (see organ-art.ts), recoloured into
 * three flat tones of each layer's colour so their shading survives without
 * a gradient anywhere. The level is `recoveryFill` in timeline.ts — a
 * position on a published curve, not a measurement of anyone.
 */
export type Organ = 'lungs' | 'liver' | 'brain';

export function organFor(habitId: string): Organ {
  if (habitId === 'smoking' || habitId === 'vaping') return 'lungs';
  if (habitId === 'alcohol') return 'liver';
  return 'brain';
}

export const ORGAN_NAME: Record<Organ, string> = { lungs: 'Lungs', liver: 'Liver', brain: 'Brain' };

type Tones = { fLight: string; fMid: string; fDeep: string; sLight: string; sDeep: string };
const GREY: Tones = { fLight: palette.surface, fMid: palette.surface3, fDeep: palette.line, sLight: palette.surface, sDeep: palette.textFaint };
const GREEN: Tones = { fLight: palette.organLight, fMid: palette.organMid, fDeep: palette.organDeep, sLight: palette.organLight, sDeep: palette.organDeep };

function paint(art: OrganArt, t: Tones, w: number, h: number) {
  const body = art.markup
    .replaceAll('__F_LIGHT__', t.fLight)
    .replaceAll('__F_MID__', t.fMid)
    .replaceAll('__F_DEEP__', t.fDeep)
    .replaceAll('__S_LIGHT__', t.sLight)
    .replaceAll('__S_DEEP__', t.sDeep);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${art.viewBox}">${body}</svg>`;
}

/**
 * The drawing on its own, `progress` (0–1) of it green from the bottom.
 * `size` is the box it fits in; the illustration keeps its own aspect and
 * is centred in that box by its drawn bounds. Rises once on mount, after the
 * screen has settled.
 */
export function OrganPicture({ organ, progress, size, animate = true }: { organ: Organ; progress: number; size: number; animate?: boolean }) {
  const reduced = useReducedMotion();
  const level = useSharedValue(animate && !reduced ? 0 : progress);
  const art = ORGAN_ART[organ];

  useEffect(() => {
    if (reduced || !animate) {
      level.set(progress);
      return;
    }
    level.set(withDelay(durations.base, withTiming(progress, { duration: durations.reveal, easing: curves.out })));
  }, [animate, level, progress, reduced]);

  // Fit the illustration's drawn bounds into the box, centred.
  const [vw, vh] = art.viewBox.split(' ').slice(2).map(Number);
  const drawnW = vw * (art.right - art.left);
  const drawnH = vh * (art.bottom - art.top);
  const scale = Math.min(size / drawnW, size / drawnH);
  const w = vw * scale;
  const h = vh * scale;
  const offsetX = (size - drawnW * scale) / 2 - art.left * vw * scale;
  const offsetY = (size - drawnH * scale) / 2 - art.top * vh * scale;
  const organTop = offsetY + art.top * vh * scale;
  const organBottom = offsetY + art.bottom * vh * scale;

  // The level: a clipping view whose top edge sits at the waterline.
  const clip = useAnimatedStyle(() => {
    const y = organBottom - (organBottom - organTop) * level.get();
    return { top: y, height: size - y };
  });
  const inner = useAnimatedStyle(() => {
    const y = organBottom - (organBottom - organTop) * level.get();
    return { top: -y };
  });

  const grey = paint(art, GREY, w, h);
  const green = paint(art, GREEN, w, h);

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <View style={[s.layer, { left: offsetX, top: offsetY, width: w, height: h }]}>
        <SvgXml xml={grey} width={w} height={h} />
      </View>
      <Animated.View style={[s.clip, { width: size }, clip]}>
        <Animated.View style={[s.layer, { width: size, height: size }, inner]}>
          <View style={[s.layer, { left: offsetX, top: offsetY, width: w, height: h }]}>
            <SvgXml xml={green} width={w} height={h} />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  layer: { position: 'absolute' },
  clip: { position: 'absolute', left: 0, overflow: 'hidden' },
});
