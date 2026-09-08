import Svg, { Path } from 'react-native-svg';

/**
 * The one checkmark in the app.
 *
 * A typed "✓" is a font glyph: it lands at a different weight, size and optical
 * centre in every family on every platform, and next to a stroked SVG ring it
 * reads as borrowed from another design. This is one drawn shape at one weight,
 * with the round caps used everywhere else.
 *
 * Geometry is in a 24x24 box so `TICK_PATH` can be reused inside any other Svg
 * (see HealthRings) and stay the same mark.
 */
export const TICK_PATH = 'M6 12.6 L10.4 17 L18 8.2';

/** `weight` is the stroke in final pixels; it defaults to ~1/8 of the size. */
export function Tick({ size = 16, color, weight }: { size?: number; color: string; weight?: number }) {
  const px = weight ?? Math.max(1.6, size * 0.13);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={TICK_PATH}
        stroke={color}
        strokeWidth={(px / size) * 24}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
