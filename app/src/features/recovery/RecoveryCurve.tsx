import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { recoveryCurve } from './timeline';

const HEIGHT = 150;
const MONTH = 24 * 30;
// Room for the axis labels: the percentages on the left, the months underneath.
const PAD = { left: 34, right: 10, top: 12, bottom: 22 };

/**
 * The recovery curve, month by month, with a dot where the streak is.
 *
 * This is where the organ's number comes from, drawn: the anchors from the
 * research joined into a line, time along the bottom, per cent up the side.
 * The shape is the point — steep in the first weeks, flattening after — so
 * someone can see both that their early days count for a lot and why the
 * later ones move the number more slowly.
 */
export function RecoveryCurve({ habitId, hoursClean }: { habitId: string; hoursClean: number }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const anchors = recoveryCurve(habitId);
  const total = anchors[anchors.length - 1][0];
  const months = Math.round(total / MONTH);
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const px = (h: number) => PAD.left + (h / total) * plotW;
  const py = (f: number) => PAD.top + (1 - f) * plotH;

  const line = anchors.map(([h, f], i) => `${i === 0 ? 'M' : 'L'}${px(h).toFixed(1)} ${py(f).toFixed(1)}`).join(' ');
  const area = `${line} L${px(total).toFixed(1)} ${py(0).toFixed(1)} L${px(0).toFixed(1)} ${py(0).toFixed(1)} Z`;

  // Where the streak is on the curve — the same interpolation as the fill.
  const h = Math.min(total, Math.max(0, hoursClean));
  let f = 1;
  for (let i = 1; i < anchors.length; i++) {
    const [h0, f0] = anchors[i - 1];
    const [h1, f1] = anchors[i];
    if (h <= h1) {
      f = f0 + ((h - h0) / (h1 - h0)) * (f1 - f0);
      break;
    }
  }

  // Month ticks: every month up to three, then every two or three, so the axis never crowds.
  const every = months <= 3 ? 1 : months <= 6 ? 2 : 3;
  const ticks: number[] = [];
  for (let m = 0; m <= months; m += every) ticks.push(m);

  return (
    <View onLayout={onLayout} style={s.wrap} accessibilityRole="image" accessibilityLabel={`Recovery curve over ${months} months. Your streak is at ${Math.round(f * 100)} percent.`}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {[0, 0.5, 1].map((g) => (
            <Line key={g} x1={PAD.left} x2={PAD.left + plotW} y1={py(g)} y2={py(g)} stroke={palette.line} strokeWidth={1} />
          ))}
          <Path d={area} fill={palette.accentWash} />
          <Path d={line} stroke={palette.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Line x1={px(h)} x2={px(h)} y1={py(f)} y2={py(0)} stroke={palette.accent} strokeWidth={1} strokeDasharray="3 3" />
          <Circle cx={px(h)} cy={py(f)} r={6} fill={palette.accent} stroke={palette.surface} strokeWidth={2.5} />
        </Svg>
      ) : null}
      {width > 0 ? (
        <>
          {[0, 0.5, 1].map((g) => (
            <Text key={g} style={[s.yLabel, { top: py(g) - 8 }]}>
              {Math.round(g * 100)}%
            </Text>
          ))}
          {ticks.map((m) => (
            <Text key={m} style={[s.xLabel, { left: px(m * MONTH) - 20 }]}>
              {m === 0 ? 'Day 0' : `${m} mo`}
            </Text>
          ))}
        </>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: HEIGHT, marginTop: Spacing.three },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: PAD.left - 6,
    textAlign: 'right',
    color: palette.textFaint,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: type.body,
    fontVariant: ['tabular-nums'],
  },
  xLabel: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    textAlign: 'center',
    color: palette.textFaint,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: type.body,
    fontVariant: ['tabular-nums'],
  },
});
