import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens — see .claude/skills/animation. Import these; never inline
 * springs, durations, or beziers in components.
 *
 * Springs use Reanimated 4 duration+dampingRatio (≈ FM duration+bounce,
 * dampingRatio ≈ 1 − bounce). Bounce 0 is the app default.
 */
export const springs = {
  /** press in/out feedback */
  press: { duration: 150, dampingRatio: 1 },
  /** state swaps, most UI (the course default) */
  swap: { duration: 300, dampingRatio: 1 },
  /** sheets, quiz steps, larger repositioning */
  move: { duration: 500, dampingRatio: 1 },
  /** ONLY after a drag/fling release */
  drag: { duration: 500, dampingRatio: 0.7 },
  /** milestone / freedom-date hero moments only */
  hero: { duration: 700, dampingRatio: 0.75 },
  /** small elements popping (digits, badges) — more bounce reads right on small things */
  pop: { duration: 450, dampingRatio: 0.65 },
} as const;

/** Timing curves — easing before duration. */
export const curves = {
  /** strong ease-out: enters, exits, user-initiated */
  out: Easing.bezier(0.32, 0.72, 0, 1),
  /** on-screen moves/morphs */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** height/size changes */
  height: Easing.bezier(0.26, 1, 0.5, 1),
  /** crossfades paired with height */
  fade: Easing.bezier(0.26, 0.08, 0.25, 1),
  /** 1s-class dramatic reveals (freedom-date curve draw) */
  dramatic: Easing.bezier(0.77, 0, 0.175, 1),
  /** fills, holds, spinners only */
  linear: Easing.linear,
} as const;

export const durations = {
  press: 150,
  fast: 200,
  base: 300,
  sheet: 400,
  slow: 500,
  reveal: 800,
} as const;

/** Stagger between sibling entrances (≤ 6 items). */
export const stagger = 40;
