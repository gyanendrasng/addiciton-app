---
name: animation
description: Motion and animation standards for this app's UI, distilled from animations.dev (Emil Kowalski) and adapted to React Native / Reanimated 4. Use whenever building or modifying any screen, component, transition, gesture, micro-interaction, or animation — every piece of UI in this project is expected to meet this standard, so load this before writing UI code.
---

# Animation & Motion Standards

This app competes on feel. Every screen ships with intentional motion — tuned to a *recovery* app: calm, weighty, reassuring. Never busy, never casino.

**Before implementing, consult the references** (distilled from the animations.dev course the user owns — private notes, do not redistribute):
- `references/principles.md` — theory: easing blueprint, springs, timing, taste checklists, performance, accessibility, vocabulary.
- `references/techniques.md` — implementation: Framer Motion → Reanimated mapping, orchestration patterns, six case-study breakdowns, **§12 has ready recipes with starting values for this app's screens** (quiz auto-advance, score ring, freedom-date reveal, press-hold pledge, breathing circle, milestone celebration, sheets).
- `references/course/*.txt` — raw lesson extracts (source of truth if a note seems off).

## Motion personality

- **Calm authority.** Springs settle without gratuitous bounce (bounce 0 is the default; small bounce only after a drag/fling or in the milestone hero moment). Nothing moves at rest.
- **Earned celebration.** Big motion is reserved for meaningful events: milestone, urge survived, pledge made, freedom-date reveal. Daily interactions get subtle motion. If everything animates loudly, milestones mean nothing. (Course: scarcity of motion preserves its value; frequency-of-use rule — the more often an interaction runs, the less it should animate.)
- **Continuity over teleportation.** Morph and crossfade between states; numbers count with tabular-nums; bars fill; blur (~2–5px) bridges state gaps that would otherwise jump-cut.
- **One hero per screen**, and **one entrance animation per container** — never stack entrances on nested elements.

## Core laws (from the easing blueprint — memorize)

1. **Ease-out for everything entering, exiting, or user-initiated.** Built-in `ease-out` is too weak — use the tokens below.
2. **Ease-in-out for on-screen moves/morphs** (something already visible changing place or shape).
3. **Never ease-in.** Sluggish starts read as lag.
4. **Linear only for mechanical motion**: progress fills, marquee, hold-to-confirm fills, spinners.
5. **Exits faster than entries.** Leaving UI gets a shorter duration than arriving UI.
6. **Everything interactive under 300ms.** Press feedback ~150ms, tooltips ~125ms, state swaps 180–300ms, sheets 200–500ms; up to ~1s only for large non-interactive morphs/reveals.
7. **Never animate in response to keyboard actions** (typing must feel instant).
8. **Choose easing before duration** — a wrong curve can't be fixed by tweaking ms.

## Micro-interaction values (course-calibrated)

- Press feedback: scale **0.97** (never 0.9) with the `press` spring; build one `<Tap>` Pressable wrapper and use it for every touchable. Hit targets ≥ 44pt (`hitSlop`).
- Hover/focus-style emphasis: scale **1.01–1.02**, never 1.05+.
- Enter-from scale: **0.85–0.95**, never `scale(0)`; set transform origin toward the trigger; exit mirrors the entry direction.
- State swap (content replacing content): `y ±25` + fade, spring 300ms bounce 0 (techniques.md §2).
- Stagger children **40ms** (≤6 items).
- Counters/timers: `fontVariant: ['tabular-nums']` always.

## Stack (what to use for what)

Installed: `react-native-reanimated` 4.x, `react-native-gesture-handler` 2.x, `expo-glass-effect`, `expo-image`; add `expo-haptics` at first use, `@shopify/react-native-skia` when rings/orbs/particles/ink arrive, `lottie-react-native` only for pre-authored assets.

| Need | Use |
|---|---|
| All property animation | Reanimated 4 shared values + `withSpring`/`withTiming` worklets |
| Enter/exit/mount | `entering`/`exiting` + `LinearTransition` for layout shifts |
| Gestures driving motion | `Gesture.*` + shared values; direct 1:1 tracking while touching, spring only on release |
| Rings, orbs, particles, signature ink, path draws | Skia (use `trim` for path-draw effects; see techniques.md §9) |
| Blur bridges / morphs | BlurView or Skia blur, ≤ ~20px (perf), usually 2–5px |
| Screen transitions | expo-router native transitions; shared-element morph via techniques.md §1 (layoutId translation) |

## Tokens — `src/theme/motion.ts` (import, never inline)

```ts
import { Easing } from 'react-native-reanimated';

// Springs: Reanimated 4 duration+dampingRatio ≈ FM duration+bounce (dampingRatio ≈ 1 − bounce)
export const springs = {
  press:  { duration: 150, dampingRatio: 1 },   // press in/out feedback
  swap:   { duration: 300, dampingRatio: 1 },   // state swaps, most UI (the course default)
  move:   { duration: 500, dampingRatio: 1 },   // sheets, steps, larger repositioning
  drag:   { duration: 500, dampingRatio: 0.7 }, // ONLY after drag/fling release
  hero:   { duration: 700, dampingRatio: 0.75 },// milestone/orb moments only
} as const;

// Timing curves (for withTiming; easing before duration!)
export const curves = {
  out:      Easing.bezier(0.32, 0.72, 0, 1),    // strong ease-out (Vaul sheet curve)
  inOut:    Easing.bezier(0.65, 0, 0.35, 1),    // on-screen moves/morphs
  height:   Easing.bezier(0.26, 1, 0.5, 1),     // height/size changes (family drawer)
  fade:     Easing.bezier(0.26, 0.08, 0.25, 1), // crossfades paired with height
  dramatic: Easing.bezier(0.77, 0, 0.175, 1),   // 1s-class reveals (freedom date curve draw)
  linear:   Easing.linear,                      // fills, holds, spinners only
} as const;

export const durations = { press: 150, fast: 200, base: 300, sheet: 400, slow: 500, reveal: 800 } as const;
export const stagger = 40;
```

## Hard rules

1. **UI thread only.** Every animation is a shared-value worklet. No setState loops, no JS timers driving visuals.
2. **60fps floor on mid-range Android, 120fps target.** Transform + opacity only; layout changes go through `LinearTransition`; never animate shadows on Android; blur is expensive — budget it.
3. **Interruptible by default.** Springs carry velocity; a re-tap mid-flight must retarget smoothly, never queue or glitch. Cancel running orchestrations before starting new ones (cancel → animate pattern, techniques.md §2).
4. **Haptics pair with motion.** `selectionAsync` for selection/toggles, `impactAsync(Light|Medium)` for commits, `notificationAsync(Success)` for milestones. Never one without the other.
5. **Reduced motion from day one.** `useReducedMotion()` → remove / reduce / replace: kill movement and scale, keep opacity/color crossfades; all-or-nothing for decorative sequences (don't half-animate).
6. **Nothing loops at rest** (exceptions: urge-flow breathing circle, active timers). Idle/ambient motion only where the course pattern applies — desynced, slow, and only in the urge flow.
7. **The next-day review.** Rewatch every shipped animation with fresh eyes (or screen-record and scrub frame-by-frame) before calling it done — the course's judgement method.

## Signature moments (recipes: techniques.md §12)

- **Quiz auto-advance**: answer confirms (tint + selection haptic) → old question exits up/fade, next enters `y +25`, `springs.swap`; progress bar fills with `curves.out`.
- **"Analyzing…"**: checklist ticks stagger in (~400ms apart), each row settles with `springs.swap`.
- **Dependency score**: count-up with decelerating rate + Skia ring draw (`trim`), color neutral→amber; single Medium impact on land.
- **Freedom date** (most-polished screen): date reveals with `springs.hero`, rewiring curve draws with `curves.dramatic` ~1s, marker drops last; Success haptic.
- **Signature**: ink follows finger 1:1 (gesture-direct, no spring while touching); on confirm the signature lifts and settles onto the pledge card with `springs.move`.
- **Pledge button**: press-hold linear fill (~1.8s, cancel on early release) → morph to "Pledged ✓", Success haptic.
- **Home streak**: settles once with `springs.swap` on open; orb is static at rest — tier *transitions* are the celebration (duplicated-view crossfade morph: scale 0.9 + blur 5px + 50ms delay, techniques.md §7).
- **Urge flow**: breathing circle scale loop matched to breath timing (the one allowed loop); delay-timer ring linear.
- **Milestone**: full-screen orchestrated takeover (cancel-then-`Promise.all` orchestrator, techniques.md §2/§12), Skia particles, `springs.hero`, Success haptic. Rare by design.
- **Relapse flow**: minimal motion, slow crossfades (`curves.fade`), no red flashes, no drama.

## Review checklist (before any UI change is "done")

- [ ] Easing chosen per the core laws (and before duration); no built-in weak curves
- [ ] Values from `motion.ts` — no inline springs/durations/beziers
- [ ] 60fps on Android mid-range; transform/opacity only; no rest-state loops
- [ ] Interruptible: rapid-tap and mid-flight reversal tested
- [ ] Exits shorter than entries; one entrance per container; origin toward trigger
- [ ] Haptics paired per rules; tabular-nums on any digits
- [ ] Reduced-motion path works (remove/reduce/replace)
- [ ] Next-day (or scrubbed-recording) review done
