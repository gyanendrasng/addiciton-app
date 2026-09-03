# Course Techniques Distilled — Framer Motion Module + Case Studies (translated to Reanimated / RN)

Distilled from the animations.dev Framer Motion module and the four walkthrough case studies
(Family Drawer, Dynamic Island, Navigation Menu, Hero Illustration), rewritten for **our stack:
React Native + Expo + Reanimated 4 + Gesture Handler (+ Skia planned)**. Every technique keeps the
course's concrete values (durations, beziers, spring configs) and adds the RN translation.

---

## 1. Core Framer Motion → Reanimated mapping table

| Framer Motion (as used in course) | Reanimated / RN equivalent |
|---|---|
| `motion.div` + `style`/`animate` | `Animated.View` + `useAnimatedStyle` driven by shared values |
| `initial={{...}} animate={{...}}` (mount animation) | `entering={FadeIn/SlideIn...}` builder, or set shared value in a mount effect / `withDelay` |
| `exit={{...}}` + `<AnimatePresence>` | `exiting={...}` on the view (Reanimated removes it from layout and animates a snapshot — this already behaves like FM's `popLayout`) |
| `AnimatePresence mode="popLayout"` | Default `exiting` behavior in Reanimated (exiting views leave layout flow). For manual control: absolutely-position the outgoing copy |
| `AnimatePresence mode="wait"` (exit-before-enter) | No built-in: animate out with `withTiming(..., cb)` → `runOnJS(setState)` → new view's `entering`; or give the entering view `.delay(exitDuration)` |
| `AnimatePresence initial={false}` | Skip `entering` on first render (e.g. `entering={mounted ? anim : undefined}` or a `firstRender` ref) |
| `key={state}` to force exit/enter swap | Same pattern: keyed `Animated.View` with `entering`/`exiting` |
| `layout` prop (auto layout animation) | `layout={LinearTransition}` (or `LinearTransition.springify()`, `CurvedTransition`, custom) |
| `layoutId` shared-element morph | No direct equivalent. Options: (a) restructure so the "two" elements are ONE persistent view whose width/height/radius/position animate; (b) measure source + target and animate an absolutely-positioned overlay clone; (c) Reanimated shared element transitions (screen-level, still experimental). Prefer (a) |
| `useMotionValue` | `useSharedValue` (both bypass React re-renders) |
| `useSpring(v, config)` | `useSharedValue` + write with `withSpring(v, config)`; for continuous tracking, `withSpring` on every gesture update |
| `useTransform(v, [in], [out])` | `useDerivedValue(() => interpolate(v.value, [in], [out]))` |
| `useTransform(v, fn)` (formatting, e.g. `°` counter) | `useDerivedValue` returning a string + `ReText` (react-native-redash) or `useAnimatedProps` on `TextInput` |
| `useMotionTemplate` (animated string, e.g. clip-path) | `useDerivedValue` building the string; for SVG use `useAnimatedProps` |
| `transition={{ type: "spring", duration, bounce }}` | `withSpring(v, { duration, dampingRatio })` — Reanimated's duration-based springs; **dampingRatio ≈ 1 − bounce** (bounce 0 → dampingRatio 1, bounce 0.35 → ~0.65, bounce 0.5 → ~0.5) |
| `transition={{ type: "spring", stiffness, damping, mass }}` | `withSpring(v, { stiffness, damping, mass })` — physics springs carry over 1:1 |
| `transition={{ duration, ease: [a,b,c,d] }}` | `withTiming(v, { duration: ms, easing: Easing.bezier(a,b,c,d) })` (FM seconds → Reanimated ms) |
| Keyframe arrays + `times: [...]` | `withSequence(withTiming(k1, {duration: d*(t1-t0)}), withTiming(k2, ...))` — convert each `times` gap into a segment duration; or the `Keyframe` API for enter/exit |
| `repeat: Infinity, repeatType: "loop"/"reverse", repeatDelay` | `withRepeat(anim, -1, reverse)`; emulate `repeatDelay` by appending a `withDelay`/hold segment inside the repeated sequence |
| `delay` | `withDelay(ms, anim)` or `.delay(ms)` on entering builders |
| `whileTap={{ scale: 0.98 }}` | `Pressable` onPressIn/Out or `Gesture.Tap`/`LongPress` → `withSpring(0.97)` / back |
| `whileHover` | No hover on touch; map to press-in state (course's Polish lesson does the same for mobile: two-tap pattern) |
| `drag` / `dragConstraints` / `dragMomentum` | `Gesture.Pan()` + shared values; momentum = `withDecay`; constraints = `clamp` in `onUpdate` |
| `useAnimate` (imperative, selector-based orchestration) | Plain functions that write to named shared values; completion via `withTiming(..., (finished) => runOnJS(next)())`; group with your own orchestrator function (see §2) |
| `MotionConfig` (default transition for subtree) | A shared constants module (`SPRINGS.ts` / `EASINGS.ts`) imported everywhere — same effect, explicit |
| `useMeasure` (bounds for height animation) | `onLayout` on the inner content view → write height to a shared value |
| `filter: "blur(4px)"` animation | No CSS filters. Approximate with opacity+scale; real blur: animated `intensity` on `expo-blur` BlurView via `useAnimatedProps`, or Skia `BlurMask`/`ImageFilter` for canvas content |
| `useReducedMotion` | Reanimated `useReducedMotion()` (or `AccessibilityInfo.isReduceMotionEnabled`) |
| SVG `pathLength` / `strokeDashoffset` draw | `react-native-svg` `AnimatedProps` on `strokeDashoffset`, or (better) Skia `Path` with animated `start`/`end` trim 0→1 |
| SVG path morph via `useTransform(progress, [0,1], paths)` | Skia `interpolatePaths(progress, [0,1], [p1, p2])` (paths need matching verb structure — same rule as FM) |

Course guidance on library choice, translated: use CSS (→ RN: `entering`/`exiting` builders and layout transitions) for simple enter/exit; reach for full shared-value orchestration only when coordinating many elements. Keep the simple path simple.

---

## 2. Orchestration patterns

**Enter/exit as a pair.** The course's default state-swap animation (button label, step content):
enter from one side, exit to the other, both `opacity` + translate. Canonical values: `initial {opacity 0, y −25}`, `animate {opacity 1, y 0}`, `exit {opacity 0, y +25}`, spring `duration 0.3, bounce 0`.
RN: keyed `Animated.View` with custom `entering`/`exiting` (e.g. `FadeInUp` variants or `Keyframe`), spring `{duration: 300, dampingRatio: 1}`.

**The three AnimatePresence modes and when the course uses them:**
- *sync/popLayout* (both visible at once, exiting removed from layout): crossfades — family drawer content, countdown digits, multi-step pages. Default fit for Reanimated `exiting`.
- *wait* (old fully leaves, then new enters): copy→checkmark button, play↔pause icon. RN: exit callback → state swap → delayed enter.
- Rule of thumb from the course: **if an exit animation looks broken, the mode is wrong — usually you want popLayout.** In RN the analog: if a crossfade jumps, absolutely-position the exiting copy.

**Variants-style organization.** Define every state's target values + transition **in one place** (a `variants.ts`), keyed by state name (`initial / hover / idle / click`), with per-index functions for element groups (`lineVariants.hover(i)`). Handlers become one-liners: `play("hover")`. Benefits called out: all timing lives in one file; each state readable at a glance; scales with complexity. RN: same shape — plain objects `{ values, config }`, an `applyVariant(sharedValues, variant)` helper.

**The orchestrator pattern** (from the hero-illustration refactor — this is the pattern to copy):
```ts
async function playState(variant) {
  inFlight.current?.cancel();            // stop conflicting animations first
  const anims = [
    animateBg(variants.bg[variant]),
    animateHand(variants.hand[variant]),
    ...lines.map((l, i) => animateLine(l, variants.line[variant](i))),
  ];
  return Promise.all(anims);             // caller can await completion
}
```
RN: each `animateX` wraps `withTiming/withSpring` in a Promise resolved from the completion callback via `runOnJS`. `cancelAnimation(sv)` = FM's `.stop()`.

**Await-then-chain.** Gate interactions on animation completion with a **ref, not state** (`hasCompletedRef`) to avoid re-renders. Sequence idle-loop restarts: `await` all reset animations (`Promise.all`) → start idle loop; never start a loop while resets are in flight.

**Staggering.** Course staggers are tiny: **40 ms** between the middle and outer rays; per-digit/per-item delays in the same range. RN: `withDelay(i * 40, ...)` or `entering={Anim.delay(i * 40)}`.

**Layered timing beats lockstep.** In multi-part animations each element starts/ends at a different moment (hand reaches position at 40% of the timeline, background pulse starts 0.2 s late, rays draw in the last 20%). This "organic offset" is a core feel technique — express with `times`-derived `withSequence` segments and `withDelay`s.

**Keyframe visibility trick.** To show an element *only during exit*: keep it at opacity 0, and make its exit animation a keyframe starting at 1 (`opacity: [1, 0]`). Used for the Dynamic Island's duplicated exit view. RN: an absolutely-positioned copy whose opacity sequence runs only when the state changes.

**MotionConfig.** When many elements share a transition, set it once (trash lesson uses `{spring, duration 0.5, bounce 0.2}` app-wide). RN: export `const DEFAULT_SPRING = { duration: 500, dampingRatio: 0.8 }` from a tokens module.

**Stale-state fix.** FM needs `custom` on AnimatePresence so *exiting* views see fresh data (direction, size). RN: compute exit params **at trigger time** and store in shared values/refs before the swap, so the exiting view reads current values.

---

## 3. Case study: feedback popover (button ⇄ popover morph)

**Interaction:** a "Feedback" pill button morphs into a popover containing a textarea; submit shows loading → success; the popover then morphs back into the button.

**States:** `open: bool` × `formState: idle | loading | success`. Timings from the code: loading lasts **1500 ms** before success; popover auto-closes **3300 ms** after submit (≈1.8 s of success display).

**The morph:** both button and popover carry `layoutId="wrapper"`; border-radius animates **8 → 12** (kept in `style`, in px, so FM can correct scale distortion). The trick that sells it: the popover's "Feedback" placeholder is **not** the textarea placeholder — it's a separate `<span>` with `layoutId="title"`, so the button label appears to become the placeholder. When the user types, the span hides (data attribute → opacity 0). A real (invisible, opacity 0) placeholder is kept for screen readers.

**Submit button label swap:** AnimatePresence `popLayout`, `initial={false}`, keyed by formState: `{opacity 0, y −25} → {1, 0} → exit {0, y +25}`, spring `duration 0.3, bounce 0`.

**Success transition:** form exits downward while success UI enters from the top **simultaneously** (popLayout), with slight blur; closing morphs the success card back into the button (same layoutId).

**Detail work that makes it feel good:** Esc closes; ⌘/Ctrl+Enter submits; click-outside closes; state resets on reopen.

**RN translation:** don't chase `layoutId` — make the wrapper a single persistent `Animated.View` and animate `width/height/borderRadius` (measure target content via `onLayout`) with a `duration 300, dampingRatio 1` spring; crossfade inner content with keyed entering/exiting views (§2 canonical values). The "fake placeholder" trick ports directly (absolute Text over a TextInput, hide on first keystroke ~150 ms fade).

---

## 4. Case study: multi-step component (onboarding-style steps)

**Step transition:** AnimatePresence `popLayout` + `initial={false}`, content keyed by step index. Enter `x: "110%"`, exit `x: "−110%"`, both with opacity; spring `duration 0.5, bounce 0`. (110% not 100% so shadows/edges fully clear the container.)

**Direction awareness:** flip the x signs when going back. FM needs the `custom` prop on both AnimatePresence and the motion.div because the exiting element's props are stale. RN: keep `direction` in a ref/shared value written **before** `setStep`, and build `entering`/`exiting` from it (e.g. custom `SlideIn(dir)` / `SlideOut(dir)` builders), or use `Keyframe`s chosen at trigger time.

**Height animation:** the container can't animate auto→auto. Measure the inner content (`useMeasure` → RN `onLayout`) and animate the wrapper's height to the measured value with the same transition; give the button row `layout` (RN: `layout={LinearTransition}`) so it rides the height change instead of jumping. One `MotionConfig` supplies the `duration 0.5, bounce 0` spring to everything so page-slide + height + buttons feel like one motion.

**Gotcha:** rapid state switching can leave two children mounted (FM bug). RN equivalent care: debounce rapid taps or cancel in-flight exits before starting new ones.

---

## 5. Case study: trash interaction (photos → trash bin)

The lesson teaches **shared-layout choreography + z-order faking + parent-driven motion**:

- **Toolbar appear/disappear:** `{y 20, opacity 0, blur 4px} → {0, 1, 0}`, exit mirrors; spring `duration 0.3, bounce 0`.
- **Grid image → trash image:** `layoutId` per image (`image-${id}`) — the trash pile images are *different elements*; FM flies them over. Pile styling: alternating rotation `±4° × (count − index + 1)` for a strewn look, borderRadius 6.
- **Trash can enter/exit:** `{opacity 0, blur 4px, scale 1.2} → {1, 0, 1}`, spring `duration 0.2, bounce 0`.
- **Unselected images vanish:** quick exit `{opacity 0, blur 4px}` at `duration 0.05` so they don't distract.
- **Z-order trick:** images visually go *into* the bin by toggling the bin's front face with a **zero-duration opacity change delayed 0.175 s** — timed to flip exactly when the flying images arrive. Timing a layer swap is cheaper than real 3D masking.
- **Parent-driven drop:** you can't customize a shared-layout flight path, but **animating the parent moves the children with it** — the drop-into-bin is `animate={{ y: 73 }}` with `delay 0.13` on the wrapper.
- **MotionConfig** default: spring `duration 0.5, bounce 0.2`.

**RN translation:** no layoutId — measure grid-cell and bin positions, render flying clones in an overlay, animate x/y/scale/rotation with `withSpring({duration 500, dampingRatio 0.8})` staggered ~30–50 ms; same z-order trick (delayed instant opacity flip on the bin front, `withDelay(175, withTiming(1, {duration: 0}))`); same parent-drop idea (animate a container the clones live in).

---

## 6. Case study: family drawer (the gold-standard sheet)

**The analysis method (copy this process):**
1. Record the real thing (phone screen recording), replay frame-by-frame / slow-mo.
2. Before slow-mo, write first impressions: feels fast → ease-out or no-bounce spring; probably only opacity + height animate; it's draggable → use an existing drawer lib.
3. Slow-mo findings: subtle **crossfade** of old/new content; content **follows the drawer height** (exiting content moves with the resize); enter and exit share one duration; fade-out is almost invisible at full speed; **bouncy press-scale on buttons is crucial to the feel**; bottom action buttons have their own smaller-y, slight-scale transition.
4. Conclusions before coding: fast (≤ ~300 ms), spring/ease-out, crossfade via popLayout, bouncy buttons.

**Build (all final values):**
- **Drawer lib:** Vaul (iOS-sheet behavior: momentum drag, overlay tracks drag). RN equivalent: a Gesture-Handler sheet (or @gorhom/bottom-sheet) — don't hand-roll momentum drag.
- **Height animation:** measure content (`useMeasure` → `onLayout`), animate container height: **duration 0.27 s, ease `[0.26, 1, 0.5, 1]`** (strong ease-out, snappy).
- **Content crossfade:** AnimatePresence `popLayout`, `initial={false}`, keyed by view: `initial/exit {opacity 0, scale 0.96}`, animate `{1, 1}`; **duration 0.27 s, ease `[0.26, 0.08, 0.25, 1]`** — a deliberately *lighter* ease-out than the height so the fade stays visible but stays in sync (same family of curve, never mix ease-out with ease-in-out here).
- **0.27 s** was found by trial; note the method: **choose the easing first, then tune duration** — duration depends on the curve.
- **Dynamic opacity duration:** short→short view changes showed too much fade. Fix: scale fade duration with height delta: `clamp(|Δheight| / 500, 0.15, 0.27)` seconds. Height duration stays fixed at 0.27.
- **Sheet open/close:** Vaul's default 500 ms felt slow for a detached (floating, rounded-36) sheet → overridden to **200 ms `cubic-bezier(0.165, 0.84, 0.44, 1)`** for both transform and overlay so open→resize feels like one entity. (Keep ~500 ms only for full-bleed iOS-style sheets touching screen edges.)
- **Finishing touches:** buttons scale **1 → 0.95** on press; close button `active` scale **0.75**; matching the original's font/spacing matters to the illusion.

**RN recipe:** container height = shared value ← `onLayout` of content, `withTiming(h, {duration: 270, easing: Easing.bezier(0.26, 1, 0.5, 1)})`; content = keyed Animated.View, entering fade+scale-from-0.96 / exiting reverse at `Easing.bezier(0.26, 0.08, 0.25, 1)` with the dynamic duration formula; exiting view absolutely positioned (popLayout behavior).

---

## 7. Case study: dynamic island

**Design intent (Apple):** "designed to feel like a living organism… deliberate elasticity." → springs **with bounce** are mandatory; getting the spring wrong kills the illusion. Apple actually waits (exit-then-enter) between rich states; the course builds the harder, nicer **crossfade** morph.

**Ring view:**
- Island width animates between **fixed** values (128 → 148 when silent) — fixed, not auto, for full control. Spring bounce **0.5**.
- The pill has `layout` + `borderRadius: 9999` **in px inline style** — layout animations run on transforms and distort radius/shadows unless FM can compensate, which needs px. (RN: animate width/radius directly with shared values; no distortion issue.)
- Text swap ("Ring" ⇄ "Silent"): popLayout + keys; set transform-origin **right** on the exiting "Ring" so it exits toward the correct side.
- Red "silent" background: animate **width 0 → 40 px** (absolutely positioned, so cheap) + opacity + blur; spring bounce **0.35**.
- Bell shake = rotate keyframes on the *wrapper group* (so the strike-through line shakes free): to-ring `[0, 20, −15, 12.5, −10, 10, −7.5, 7.5, −5, 5, 0]`, to-silent `[0, −15, 5, −2, 0]`; bell shifts x **8.5–9 px** to center in the red pill; strike-line "draws" by animating **height 0 → 16 px**. Timing tuned so the bell "pops" into its new state.
- Extra credit detail: Apple animates the clapper independently of the bell.

**Timer view:**
- Countdown digits: each digit keyed, AnimatePresence `popLayout` + `initial={false}`: `{y 12px, blur 2px, opacity 0} → {0, 0, 1} → exit {y −12px, blur 2px, opacity 0}`, spring bounce **0.35**. Use **tabular-nums** so digits don't shift (RN: `fontVariant: ['tabular-nums']`).
- Play/pause button: `mode="wait"` (icon fully leaves first): `{opacity, scale 0.5, blur 4px}`, duration **0.1 s**. Rules of thumb stated: never scale to 0 for icon swaps (0.5 floor); keep blur small (~4–5 px — big blur spreads ugly and hurts Safari perf); `whileTap` on the button.

**Morph effect (the crown jewel):**
- Problem: popLayout inside a container that changes width *and* height loses control. Solution: **duplicate the active view.** Copy A (inside the pill) only *enters*: `initial {scale 0.9, opacity 0, blur 5px} → animate {1, 1, 0}` with **delay 0.05**. Copy B sits in an absolute, pointer-events-none overlay and only *exits*: initial opacity 0, exit keyframes `opacity [1, 0]` + `blur 5px` (the `[1,0]` makes it appear exactly at exit time).
- **Hardcoded per-transition exit variants** (tried a formula, hardcoding won for tune-ability):
  - `ring→idle`: scale 0.9, scaleX 0.9, bounce 0.5
  - `timer→ring`: scale 0.7, y −7.5, bounce 0.35
  - `ring→timer`: scale 1.4, y +7.5, bounce 0.35
  - `timer→idle`: scale 0.7, y −7.5, bounce 0.3
  Logic: exiting content scales **toward the size of the destination** (growing island → exiting scales up; shrinking → down); `scaleX 0.9` tucks content in when the island narrows so nothing bleeds past the pill.
- **Per-transition bounce** (`BOUNCE_VARIANTS`): idle/ring-idle/idle-ring **0.5**, timer-ring/ring-timer **0.35**, timer-idle/idle-timer **0.3**. Insight: **smaller targets need more bounce to read**; one global bounce makes big views feel too fast and small ones lifeless.
- Track `variantKey = "${from}-${to}"` on every switch to look up both tables.

**RN translation:** the pill is one persistent Animated.View — animate width/height/borderRadius with `withSpring({duration ~550, dampingRatio: 1 − bounce})`; content enter = keyed view with scale 0.9 + opacity (+ BlurView intensity 5→0 if affordable) delayed 50 ms; exit = absolute overlay clone running the hardcoded per-transition scale/y/bounce. The from-to lookup tables port verbatim.

---

## 8. Case study: navigation menu

**Tools lesson:** Before building, study how great products do it (Stripe was the model for Vercel's nav; same approach used at Linear). Don't invent patterns — steal like an artist. Use a battle-tested primitive (Radix NavigationMenu) for keyboard nav, focus management, a11y; you style and animate on top. A library that exposes **animation-friendly state attributes** is worth choosing for that alone.

**Menu animation approach (mechanism, since it's CSS-on-Radix):**
- **Width/height animation:** the shared viewport animates to each panel's size via Radix's measured CSS vars (`--radix-navigation-menu-viewport-width/height`) + a CSS transition — i.e., *measure content, animate container* (same pattern as drawer height). RN analog: measure each panel with `onLayout`, animate container size shared values.
- **Enter/exit:** fade/scale the viewport in/out on open/close, driven by `data-state` open/closed keyframes (RN: entering/exiting on the popover view).
- **Switching panels:** old content fades out while new fades in **from the direction of travel** — Radix stamps `data-motion="from-start | from-end | to-start | to-end"`, you attach directional keyframes. This is direction-aware animation handed to you by the primitive. RN: compute direction from tab indices (same as multi-step §4).
- One shared viewport + sliding content = the "one container morphs, contents crossfade" pattern again.

**Closing thoughts' rules:**
1. **Reduced motion is a per-animation question you must always ask** — here, a busy animation gets `animation: none` under `prefers-reduced-motion` (RN: `useReducedMotion()`).
2. **Don't chase the shiny library** (Stitches cautionary tale). Choose maintained-enough, battle-tested tools; unmaintained code doesn't stop working, but bet deliberately.
3. Users never see your code — using a high-quality existing component beats 20 hours of hand-rolling.

---

## 9. Case study: hero illustration (SVG) — for future Skia work

**SVG fundamentals taught:** coordinates not flow (everything positions at explicit coords; degenerate shapes vanish); `viewBox` is a camera — animate it for pan/zoom; path commands `M/L/l/Z` (upper = absolute, lower = relative; `Z` closes cleanly, avoiding the open-corner defect).

**Line drawing (dash technique):** `strokeDasharray = dash gap`, `strokeDashoffset` shifts the pattern. Draw-on effect = dash length ≥ path length, offset = full length (hidden) → animate to 0. **Normalize with `pathLength="1"` (or 100)** so all paths share animation values. **Make the gap slightly larger than the dash (1 vs 1.1)** — round line caps extend past the mathematical dash and would peek through. *Skia:* prefer `Path` with animated `start`/`end` trim (0→1) — trim replaces the whole dash hack; keep the dash method for react-native-svg.

**Rotation:** SVG transform-origin defaults to viewBox (0,0); `transform-origin: center` means viewBox center, not element center. Fix: explicit px origin, or `transform-box: fill-box` to make origins element-relative. Clock hands: origin `0% 100%` (the pivot end of the line). Rotating a group **around a distant point** (bells around the clock center, origin `76.3 69.5` view-box relative) gives orbital swing with a single rotate. *Skia:* build transforms explicitly — translate(−origin) → rotate → translate(origin) — so this maps naturally.

**Click animation (hand click) — the orchestration showcase:**
- Why imperative (`useAnimate`): many elements, several triggers (hover/click/idle loop), need to *await completion* across elements; declarative variants would need state + completion bookkeeping and re-renders. Path morphing forces imperative anyway. (RN: this argues for the shared-value orchestrator of §2.)
- Elements tagged `data-animate="background|hand|line"` + `data-index` — selector targeting instead of refs. Wrap elements in groups per concern (one group holds the filter, nested groups let you **layer independent transforms on one element**).
- **Background squash-stretch pulse:** scale keyframes `[1, 0.97, 1.01, 1]` — compress → overshoot → settle. Hover: duration **0.53**, times `[0, 0.2, 0.6, 1]`, easeOut, **delay 0.2** (syncs with the finger click, not the hover). Click: times `[0.1, 0.3, 0.65, 1]`, **no delay** (instant feedback). Idle: duration **0.63**, times `[0.2, 0.5, 0.85, 1]`.
- **Hand moves into position:** `translateX(−4px) translateY(3px) rotate(25deg)` (values found by live-tweaking in devtools), duration 0.53, times `[0, 0.4]` (in place by 40%), easeInOut.
- **Path morph** (finger curl): `progress` motion value + `useTransform(progress, [0,1], [openPath, clickedPath])` (paths share structure; use flubber if not). Animate progress `[0, 1, 0]`: hover times `[0.4, 0.6, 0.9]`, click `[0.1, 0.3, 0.6]` (same proportions, earlier), idle `[0.1, 0.4, 0.8]`. *Skia: `interpolatePaths`.*
- **Motion rays:** `strokeDasharray "1px 1.1px"`, `pathLength 1`; resting offsets `[0, 0.55, 0.9]` (staggered look); animate `1.05 (hidden) → 0` (middle line, full) or `→ 0.4` (outer lines, 60% drawn); outer lines delayed **0.04 s**; all revealed within times `[0.7, 0.9]` — a punchy 20%-of-duration flick as the click lands.
- **Idle loop:** all of the above with `repeat: Infinity, repeatDelay 2, delay 2` (production hero uses `repeatDelay 6`, first `delay 2.5`). Rays loop trick: keyframes `[default, 1.05, default]` with times `[0.5, 0.5, 0.8]` — two identical times = instant jump, then animated return.
- **Completion gating:** `await` one animation (same duration) → set `hasCompletedRef = true`; clicks ignored until then; mouse-leave resets ref, `Promise.all`s the resets, then restarts idle.
- **Refactor:** variants file + `useAnimateVariant` (strips `transition` from variant, falls back to spring `{stiffness 800, damping 80, mass 4}`) + `playAnimationState` orchestrator (§2).

**Clock animation:**
- Idle: bells swing `rotate [0, −10, 10, 0]`, duration **1 s**, easeInOut, repeat ∞, repeatDelay 2, delay 2 — around the clock center (view-box origin trick).
- Hover ("alarm goes off"), all at once: background `rotate 0→−4→−3deg` with `scale 1→0.99→1` (0.3 s easeOut); clock+bells group jumps `y −3px`; clock face shakes `x [0, −1.5, 1.75, −1.75, 1.75, −1.5, 0]px`, duration **0.25 s, linear, repeat ∞**; bells drift up `y 0→−8` over **3 s** easeOut; each bell shakes individually (bell 0: ±2 px; bell 1: ∓1.5 px — smaller bell, smaller shake — plus `rotate 0→−8deg` over 3 s to keep facing the clock).
- Click (show real time): hour hand = `hours*30 + minutes*0.5` deg; minute = `minutes*6 + seconds*0.1` deg; add **+360° (hour) / +720° (minute)** so they visibly spin before landing; spring `{stiffness 250, damping 25, mass 1.2}` for a bouncy settle. Simultaneously the whole clock settles upright: `rotate/scale keyframes (0,1)→(−10°,0.95)→(−8°,1.03)→(−8°,1)`, duration **0.4**, times `[0, 0.25, 0.6, 1]`, easeOut. Initial hour rotation **120°** (displays 4:00).
- **Repeat clicks:** don't replay the settle — a `hasClickedRef` switches to a scale-only pulse (`1→0.95→1.03→1`, same 0.4 s/times). Mouse-leave resets ref + hands + restarts idle.

**Polish lesson (applies to every screen we build):**
- **Subtle life:** helper factories returning animation props — float `translateY 0→2px, 2.5 s, easeInOut, repeat reverse`; background rotate `0→2deg, 5 s`. **Deliberately different durations per element so they never sync** — that desync is what reads as organic. (RN: `withRepeat(withTiming(v, {duration}), −1, true)` per layer.)
- **Hover debounce:** trigger rich hover effects only after the pointer rests **100 ms** (like tooltip delays) to kill jitter. RN analog: for gesture-triggered flourishes, require a minimum press duration.
- **Mobile two-tap:** `pointer: coarse` detection; first tap plays the "hover" animation and returns early, second tap runs the click action; tap-outside resets; delay 0 on touch.
- **Reduced motion:** for decorative animation it's **all or nothing** — a static asset; keeping the float would falsely advertise interactivity. Return identical from/to values, early-return in handlers.
- **Performance:** only after observing dropped frames: `will-change: transform, opacity` + paint containment on animated nodes, GPU-promote filtered elements. Never preemptively — layers cost memory. RN analog: keep everything on the UI thread (pure Reanimated worklets), avoid animating layout props when transform will do, move heavy scenes to a single Skia canvas.

---

## 10. Hooks & animation patterns

- **Motion values run outside React's render cycle** — that's the whole point (60 fps without re-renders). `useSharedValue` is exactly this; never mirror an animated value into React state.
- **`useSpring` for pointer-following:** circle follows cursor with spring `{mass 0.1, damping 16, stiffness 71}` (light, quick, slightly elastic); opacity springs in on enter/leave. Generic reusable spring example: `{damping 10, mass 0.75, stiffness 100}`. RN: `Gesture.Pan().onUpdate(e => { x.value = withSpring(e.x, CFG) })`.
- **`useTransform` two ways:** (1) range mapping — distance → scale, px → %, drag-x → bar width; RN `interpolate(v, [0,300], [1,1.5], Extrapolation.CLAMP)` inside `useDerivedValue`; (2) output transform — number → formatted string. Animated counter recipe: spring value `{stiffness 185, damping 25}`, display `Math.round(v) + "°"`, `set(45)` after a **2600 ms** delay (a subtle count-up amid a busy intro). RN: `useDerivedValue` string + `ReText`.
- **Spring vs direct value:** while a **gesture is active**, values must track the finger 1:1 (`useMotionValue` = plain shared-value assignment) — a spring would feel disconnected; springs take over **on release**. Rule: gesture-attached = direct, state-triggered = spring.
- **`useMotionTemplate` clip-path reveal (interactive graph):** pointer x → `%` from right edge → `clip-path: inset(0 X% 0 0)` on the SVG — a wipe that follows the cursor; the detail that sells it is clipping the whole svg (line + gradient fill) at once. RN/Skia: animated `clipRect` width on the canvas, or `overflow: hidden` container width.
- **Numbers:** use tabular figures anywhere digits animate.

---

## 11. "How do I code animations" — the course's workflow

1. **Collect reference.** Find the best version of the interaction in the wild (Stripe, iOS, Family). Record it (screen-record on device); watch frame-by-frame and in slow motion, repeatedly, until sick of it.
2. **Decompose before coding.** Write down: which properties actually animate (usually fewer than you think — often just opacity + one dimension), what easing family (fast + ease-out/spring-no-bounce for UI, bounce for playful), rough duration (≤300 ms for interactions), which parts have *different* transitions (buttons vs content).
3. **Use existing primitives for the boring hard parts** (drawer drag, focus trap, keyboard nav) so effort goes to the animation.
4. **Structure first:** get the states rendering with instant switches (useMemo/switch keyed views), then add motion.
5. **Easing before duration** — duration is meaningless until the curve is chosen; then tune duration by feel (0.27 s beat both 0.25 and 0.3 for the drawer).
6. **Prefer hardcoded per-transition values over clever formulas** when the state space is small (Dynamic Island tables) — granular tuning beats elegance.
7. **Compare against the reference after every change.** Trial and error is the process, not a failure of it.
8. **Finish:** dynamic durations where deltas vary, press feedback everywhere, reduced-motion path, mobile input differences, perf pass only if frames drop.
9. Advanced FM features that unlock this on web — layout animations (animate the un-animatable: flex-direction, position), shared layout (connect two elements across renders), gestures with momentum. In RN we get the same via layout transitions, measured overlay morphs, and Gesture Handler + `withDecay`.

---

## 12. Reusable recipes for our app

**Onboarding quiz auto-advance** (multi-step, §4):
- On answer tap: option press-scale 1→0.97 spring; hold the filled state ~**250–350 ms** so the selection registers, then advance.
- Step swap: keyed content view, enter `x +110%`, exit `x −110%`, opacity, `withSpring({duration: 500, dampingRatio: 1})`; direction ref for back navigation; container height animated from `onLayout` with the same spring; progress bar rides a `LinearTransition`.

**Score count-up + ring** (§10 counter + §9 draw):
- Number: shared value spring `{stiffness 185, damping 25}` → `ReText` with `Math.round`; start after screen settles (**delay ~600 ms**; course delayed its counter 2.6 s in a busy intro — scale to context). Tabular nums.
- Ring: Skia arc with animated `end` trim 0→score%, `withTiming(1200, Easing.bezier(0.26, 1, 0.5, 1))` — or spring `dampingRatio 1` to match the number. Keep number and ring on the **same** clock so they land together.
- Score label pops in dynamic-island style: `{scale 0.9, opacity 0} → {1, 1}` (+ blur 5→0 if using BlurView), delay 50 ms after ring starts.

**Freedom-date reveal** (timer-view digits, §7):
- Per-character keyed views: `{y 12, opacity 0, blur 2} → {0, 1, 0}`, spring `dampingRatio ≈ 0.65` (bounce 0.35), stagger **40 ms** per char.
- Precede with an exit-before-enter beat (wait-mode): old placeholder blurs/scales out (scale to 0.5 floor, 100 ms), then date enters — anticipation sells the reveal.

**Press-hold pledge button** (§9 gating + squash-stretch):
- `Gesture.LongPress`/`Pan`: on begin, progress `withTiming(1, {duration: 1800, easing: Easing.linear})` drives a ring trim + button scale 1→0.97; release early → `withSpring(0)` back (interruptible, gesture-direct per §10).
- On completion: squash-stretch pulse scale `[1, 0.97, 1.01, 1]` over **~530 ms**, segment times `[0, 0.2, 0.6, 1]` (→ withSequence 106/212/212 ms), easeOut + success haptic; then rays: 3 short strokes drawing `hidden → 60–100%` in the last 20% of the beat, outer two delayed 40 ms (§9 rays).
- Guard re-triggers with a ref, not state.

**Breathing circle** (§9 polish, subtle-life):
- Core: scale `withRepeat(withTiming(1.35, {duration: 4000, easing: Easing.inOut(Easing.quad)}), −1, true)` (tune to the breath protocol; use `withSequence` with holds for box breathing).
- Organic depth: 2–3 layers with **deliberately different periods** (e.g. halo opacity 5 s, inner rotate 2° over 7 s) so nothing syncs.
- Reduced motion: static circle + text cues only (all-or-nothing rule).

**Milestone celebration** (orchestrator, §2 + §7 morph values):
- One `playState("celebrate")` orchestrator, `Promise.all`-able: (1) badge enters `{scale 0.9, opacity 0, blur 5} → {1,1,0}`, bounce ~0.5 spring (small element → more bounce, §7); (2) container squash-stretch `[1, 0.97, 1.01, 1]`; (3) Skia ray/confetti strokes trim-draw with 40 ms staggers; (4) count-up of streak number.
- Afterwards drop to an idle pulse: repeat every **repeatDelay ≥ 2 s** (production hero used 6 s — keep celebration idle rare).

**Sheet / drawer patterns** (§6 verbatim):
- Open/close: 200 ms `Easing.bezier(0.165, 0.84, 0.44, 1)` for a floating card sheet; ~500 ms only for full-width edge-touching sheets. Overlay opacity uses the same curve/duration and tracks drag progress.
- Internal view switching: height `withTiming(measured, {duration: 270, easing: Easing.bezier(0.26, 1, 0.5, 1)})`; content crossfade `{opacity, scale 0.96}` at `Easing.bezier(0.26, 0.08, 0.25, 1)` with duration `clamp(|Δh| / 500, 0.15, 0.27)` s; exiting view absolutely positioned.
- Every button in the sheet: press scale 1→0.95 spring; close affordance can go to 0.75.

**Everywhere:** blur transitions (4–5 px max) via BlurView/Skia only where cheap — otherwise opacity+scale reads nearly the same; `useReducedMotion()` check in every decorative/celebration animation; tabular-nums for all animating digits; gesture-attached values direct, state-triggered values sprung; define all state targets in per-component `variants.ts` files with app-wide `SPRINGS`/`EASINGS` tokens.
