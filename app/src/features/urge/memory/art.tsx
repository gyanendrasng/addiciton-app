import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';

import { hues, palette } from '@/theme/palette';
import { type } from '@/theme/type';

/**
 * A picture of each game for its tile: a still from play, flat, in the
 * game's hue. Drawn rather than shipped as images so they follow the theme,
 * and so a tile is a preview of what the thumb is about to do rather than a
 * glyph that has to be decoded.
 *
 * All four share one 160 × 150 canvas and scale to the tile's width. The
 * tile clips them, so the top corners come from it, not from here.
 */
export type ArtProps = { width: number };
const VW = 160;
const VH = 150;

function frame(width: number) {
  return {
    width,
    height: (width * VH) / VW,
    viewBox: `0 0 ${VW} ${VH}`,
  } as const;
}

/** Tower: a narrowing stack, the next block mid-slide, an offcut on its way down. */
export function TowerArt({ width }: ArtProps) {
  const h = hues.progress;
  const rows = [
    { y: 130, x: 36, w: 88 },
    { y: 114, x: 40, w: 84 },
    { y: 98, x: 48, w: 76 },
    { y: 82, x: 48, w: 66 },
    { y: 66, x: 56, w: 58 },
  ];
  return (
    <Svg {...frame(width)}>
      <Rect x={0} y={0} width={VW} height={VH} fill={h.wash} />
      {rows.map((r, i) => (
        <Rect key={i} x={r.x} y={r.y} width={r.w} height={15} rx={3} fill={h.solid} />
      ))}
      {/* the sliding block, not yet over the tower */}
      <Rect x={86} y={44} width={58} height={15} rx={3} fill={h.solid} />
      {/* the offcut, falling */}
      <Rect x={128} y={96} width={10} height={15} rx={3} fill={h.solid} opacity={0.4} />
    </Svg>
  );
}

/** Flap: the bird between two pipes, mid-lift. */
export function FlapArt({ width }: ArtProps) {
  const bird = hues.reasons;
  const pipe = hues.pledge;
  return (
    <Svg {...frame(width)}>
      <Rect x={0} y={0} width={VW} height={VH} fill={bird.wash} />
      {/* pipes: one behind, one ahead */}
      <Rect x={18} y={-6} width={22} height={40} rx={5} fill={pipe.solid} opacity={0.45} />
      <Rect x={18} y={100} width={22} height={60} rx={5} fill={pipe.solid} opacity={0.45} />
      <Rect x={112} y={-6} width={24} height={62} rx={5} fill={pipe.solid} />
      <Rect x={112} y={118} width={24} height={40} rx={5} fill={pipe.solid} />
      {/* the bird, leaning into a flap */}
      <Circle cx={66} cy={74} r={13} fill={bird.solid} />
      <Circle cx={71.5} cy={69.5} r={2.6} fill={bird.ink} />
      {/* a wisp of the path it took */}
      <Circle cx={48} cy={88} r={2.2} fill={bird.solid} opacity={0.5} />
      <Circle cx={37} cy={98} r={1.7} fill={bird.solid} opacity={0.3} />
    </Svg>
  );
}

/** Merge: a corner of the board, the numbers climbing. */
export function MergeArt({ width }: ArtProps) {
  const h = hues.checkin;
  const cell = 38;
  const gap = 7;
  const ox = (VW - (3 * cell + 2 * gap)) / 2;
  const oy = (VH - (3 * cell + 2 * gap)) / 2;
  const tiles: {
    r: number;
    c: number;
    v?: number;
    fill?: string;
    ink?: string;
  }[] = [
    { r: 0, c: 0, v: 2, fill: palette.surface3, ink: palette.text },
    { r: 0, c: 1 },
    { r: 0, c: 2, v: 4, fill: palette.line, ink: palette.text },
    { r: 1, c: 0 },
    { r: 1, c: 1, v: 8, fill: h.solid, ink: h.ink },
    { r: 1, c: 2, v: 16, fill: hues.pledge.solid, ink: hues.pledge.ink },
    { r: 2, c: 0, v: 4, fill: palette.line, ink: palette.text },
    { r: 2, c: 1, v: 32, fill: hues.reasons.solid, ink: hues.reasons.ink },
    { r: 2, c: 2, v: 64, fill: hues.urge.solid, ink: hues.urge.ink },
  ];
  return (
    <Svg {...frame(width)}>
      <Rect x={0} y={0} width={VW} height={VH} fill={h.wash} />
      {tiles.map((t, i) => {
        const x = ox + t.c * (cell + gap);
        const y = oy + t.r * (cell + gap);
        return <Rect key={`c${i}`} x={x} y={y} width={cell} height={cell} rx={6} fill={t.fill ?? palette.surface2} opacity={t.v ? 1 : 0.6} />;
      })}
      {tiles
        .filter((t) => t.v)
        .map((t, i) => (
          <SvgText
            key={`t${i}`}
            x={ox + t.c * (cell + gap) + cell / 2}
            y={oy + t.r * (cell + gap) + cell / 2 + 6}
            fontSize={t.v! >= 10 ? 15 : 17}
            fontFamily={type.display}
            fill={t.ink}
            textAnchor="middle"
          >
            {t.v}
          </SvgText>
        ))}
    </Svg>
  );
}

/** Echo: the four pads, one lit. */
export function EchoArt({ width }: ArtProps) {
  const pads: (keyof typeof hues)[] = ['pledge', 'checkin', 'urge', 'reasons'];
  const size = 52;
  const gap = 9;
  const ox = (VW - (2 * size + gap)) / 2;
  const oy = (VH - (2 * size + gap)) / 2;
  return (
    <Svg {...frame(width)}>
      <Rect x={0} y={0} width={VW} height={VH} fill={hues.urge.wash} />
      {pads.map((p, i) => {
        const lit = i === 2;
        return <Rect key={p} x={ox + (i % 2) * (size + gap)} y={oy + Math.floor(i / 2) * (size + gap)} width={size} height={size} rx={12} fill={hues[p].solid} opacity={lit ? 1 : 0.28} />;
      })}
    </Svg>
  );
}
