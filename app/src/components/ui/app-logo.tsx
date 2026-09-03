import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

export function AppLogo({ size = 96, tile = true }: { size?: number; tile?: boolean }) {
  const inner = Math.round(size * (tile ? 0.74 : 1));
  const links = (
    <Svg width={inner} height={inner} viewBox="0 0 1024 1024">
      {/* lower-left link — open, already free */}
      <Path
        d="M 516.1 663.0 A 138 138 0 1 1 364.0 481.8"
        stroke={BRAND.free}
        strokeWidth={88}
        strokeLinecap="round"
        fill="none"
      />
      {/* upper-right link — still closing */}
      <Path
        d="M 507.9 361.0 A 138 138 0 1 1 660.0 542.2"
        stroke={BRAND.held}
        strokeWidth={88}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
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
  },
});
