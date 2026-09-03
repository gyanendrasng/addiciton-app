# Animation Principles (distilled from the animations.dev course)

Distilled reference, rewritten in our own words. We build in React Native with Reanimated 4;
web-specific points carry an "RN note:" translation where one makes sense.

---

## 1. What makes an animation feel right

An animation feels right when it satisfies three criteria:

1. **Natural** — it mirrors everyday physics. Nothing in the real world moves at constant
   speed, so linear motion reads as robotic and lifeless. Movement should accelerate and
   settle the way objects around us do. Familiarity = no surprise = feels right.
2. **Purposeful** — you can say why it exists (explain a feature, confirm an action,
   preserve spatial context, or — rarely — pure delight). If neither you nor the user can
   justify it, cut it. "The best animation is sometimes no animation."
3. **Made with taste** — the maker has trained judgement and a reference library of great
   work; rules cover most cases, taste covers the rest.

Supporting ideas:
- The more you animate, the less each animation is worth. If everything moves, nothing
  stands out. Pace motion through the experience.
- A subtle blur during a state crossfade bridges the visual gap between two states so the
  eye reads one continuous object instead of two distinct ones.
- Users open your product with a goal, not a wish to be delighted. Delight-only animation
  works only on rarely-seen surfaces.
- Perceived speed matters more than measured speed: a faster-spinning spinner makes
  identical load times feel shorter; ease-out makes a 300ms dropdown feel faster than the
  same 300ms with ease-in.
- iOS / the Dynamic Island are the benchmark: UI that behaves like a living organism.

---

## 2. Easing blueprint

Easing is the single biggest lever in how an animation feels — it can make a bad animation
look great and a great one look bad. The course's usage map:

| Easing | When to use |
|---|---|
| **ease-out** (fast start, slow settle) | The workhorse. All enter/exit animations and user-initiated interactions: dropdowns, modals, popovers, toasts, marketing intro reveals. The fast start reads as responsiveness. |
| **ease-in-out** (slow–fast–slow, like a car) | Elements *already on screen* that move to a new position or morph shape: timelines, page-to-container morphs, Dynamic-Island-style resizes. Also the best fit for pure rotation. |
| **ease-in** (slow start, fast end) | **Avoid.** Makes UI feel sluggish; accelerating into the endpoint is the opposite of how our brains expect motion to settle. |
| **linear** | Only for constant motion: marquees, spinners, time-progress like hold-to-delete (time passes linearly), and rare cases like a looping 3D coin rotation. |
| **ease** (asymmetric ease-in-out; CSS default) | Small, gentle property transitions: hover color / background / opacity changes. Also a deliberate "elegance over snap" choice (Sonner uses it for enter/exit instead of the technically-correct ease-out). |

Rules of thumb:
- **Built-in CSS curves are almost never strong enough.** Use custom cubic-beziers with more
  acceleration; the author only uses a built-in curve for `ease` on hovers. The course ships
  a set of 16 custom curves ordered weakest → strongest per easing family (external link;
  see also easings.co).
- Named values that appear in the course:
  - Custom ease-in-out ("ease-in-out-cubic"): `cubic-bezier(0.645, 0.045, 0.355, 1)`
  - Another symmetric ease-in-out used in the vocabulary examples: `cubic-bezier(0.65, 0, 0.35, 1)`
  - Vaul / iOS-sheet mimic (very steep start, gentle spring-like ending): `cubic-bezier(0.32, 0.72, 0, 1)` at **500ms**
  - Image reveal curves: `cubic-bezier(0.77, 0, 0.175, 1)` (1s) — a strong symmetric in-out
  - An example shown for the confusing shorthand: `cubic-bezier(0.19, 1, 0.22, 1)`
- Asymmetric curves feel more alive than symmetric ones.
- If an animation feels flat, the curve is probably too weak.
- Perceived-speed tricks: ease-out fronts the motion so the same duration feels faster;
  faster spinners feel like faster loads; a steep curve start lets you run a longer total
  duration (Vaul's 500ms) without losing snappiness.
- Press feedback: `scale(0.97)` on press with a **150ms** transition (ease-out family) makes
  buttons feel alive. (RN note: `withTiming(0.97, {duration: 150, easing: Easing.out(...)})`
  or a snappy spring on `pressIn`.)

RN note: Reanimated's `Easing.bezier(x1, y1, x2, y2)` takes these values verbatim;
`Easing.out(Easing.cubic)` ≈ ease-out, `Easing.inOut(Easing.cubic)` ≈ the custom
ease-in-out-cubic above.

---

## 3. Springs — the secret ingredient

- Duration-based easing can never be perfectly natural because real-world motion has no
  fixed duration. Springs simulate a physical object on a spring, so they're natural *by
  definition* and have no duration.
- Springs are why iOS (and the Dynamic Island) feel like living organisms; they're the
  default in SwiftUI.
- **Configuration models:**
  - Physics: `stiffness` (tension), `damping`, `mass`, plus initial `velocity`.
  - Apple/Framer-Motion alternative: `duration` + `bounce` — where duration is the
    *perceptual duration* (when the motion feels finished, even if micro-movement
    continues). Easier to reason about; prefer it.
  - Course example config (multi-step component): `{ type: "spring", duration: 0.5, bounce: 0 }`.
- **Bounce guidance:** default to **zero bounce** — that's what keeps transitions natural
  and elegant. A *small* bounce is appropriate only where the user imparted physical force,
  e.g. the end of a drag/flick gesture (throwing a ball at a wall). Tap-to-close: no bounce.
- **Interruptibility** is the killer feature: when a spring is re-targeted mid-flight it
  carries its current velocity into the new animation, so redirected motion stays smooth.
  Keyframe-style animations jump instead (Sonner's early CSS enter animation made stacked
  toasts teleport).
- **When springs vs duration:** springs for anything with real motion — gestures, drags,
  position/size changes, layout morphs, things that can be interrupted. Simple color/opacity
  fades don't need a spring. (On the web this is a bundle-size trade-off — real springs need
  JS; CSS can only approximate via `linear()`.)
- RN note: no trade-off for us — `withSpring` is native. Use
  `withSpring(x, { duration, dampingRatio })` for the Apple-style duration+bounce model
  (dampingRatio 1 = no bounce), or `stiffness`/`damping`/`mass` for the physics model.
  Gesture handlers should pass release velocity into the spring's `velocity`.

---

## 4. Timing & purpose

Duration rules of thumb:
- **UI animations should generally stay under 300ms.**
- **~180ms** dropdown/select feels responsive; **400ms** feels sluggish (both shown as the
  bad half of comparisons).
- **Hovers: 100–150ms.** 300ms is too slow for a hover.
- **Press feedback: 150ms.**
- **Tooltip enter: 125ms** (`0.125s ease-out`, opacity + scale from 0.97).
- Longer durations are earned by: **bigger elements** (heavier = slower; a full-page morph
  used 1s), **steeper easing** (Vaul: 500ms with a steep curve), and **marketing context**.
- **Exits should be shorter and simpler than entries.**
- Duration scales with element size and distance traveled.
- Too fast is as bad as too slow — there's a trackability threshold.

Frequency-of-use rules (when NOT to animate):
- The more often a user sees an animation, the shorter it should be — down to zero.
  Something opened hundreds of times a day (Raycast-style command menu) should not animate
  at all. Even 200ms becomes friction at 50 uses/day.
- **Never animate keyboard-initiated actions** (arrow-key list navigation, shortcuts):
  animation makes them feel delayed and disconnected from the keys.
- Frequently-hovered lists usually feel best with *no* hover transition.
- Tooltips: delay the first one (prevents accidental trigger), then open subsequent
  tooltips with **no delay and no animation** while one is already showing (Radix/Base UI
  behavior; Base UI `data-instant` → `transition-duration: 0ms`).
- Intro animations should run once, not replay on every navigation back.
- Delight-driven animation (morphing feedback popover) only works on rarely-used surfaces;
  daily use turns delight into annoyance.

Purpose checklist — before animating, name the purpose: explain (marketing demos),
respond (press scale, loading/success states — the interface should feel like it's
listening), orient (toast enters and exits in the same direction → the swipe-to-dismiss
gesture is discoverable; spatial consistency), or delight (rare surfaces only).

Marketing vs product: marketing pages are the packaging — slower, more memorable motion is
fine and can carry brand feeling; the product itself should aim for speed. Even on
marketing pages, restraint: if everything animates, nothing stands out.

---

## 5. Taste & judgement

How to develop taste (it is a trainable skill, not personal preference):
- Surround yourself with great work; build a curated list of tastemakers and study them.
- Copy/recreate work you admire until you can create proudly on your own.
- Don't just label good/bad — articulate *why* something feels good. Rationalize patterns
  instead of trusting gut feel.
- **Record animations and scrub frame by frame** — both others' (to learn their hidden
  details) and your own (to critique). This accelerated the author's learning more than
  anything else.
- Practice; seek critique; expect a "taste gap" (your taste outrunning your skill) and
  treat it as a good sign.
- Care: quality is mostly stubbornness about making things as good as they can be. Users
  can sense care and carelessness.
- Give work a break — review with fresh eyes at least a day later before shipping.

"Train your judgement" checklists (spot-the-flaw criteria):

*Easing*
- Entries decelerate (ease-out), never accelerate (ease-in).
- Built-in CSS curves are almost never strong enough — use custom curves.
- Asymmetric > symmetric.
- Flat-feeling animation ⇒ curve too weak.

*Duration*
- Too fast is as bad as too slow (trackability threshold).
- Frequency of use: 50×/day needs speed, not delight.
- Exits shorter and simpler than entries.
- Duration scales with size and distance.

*Hover & tap*
- `scale(1.05)` on hover is almost always too much — **1–2%** is enough.
- 300ms hovers are too slow — use **100–150ms**.
- `translateY` on hover belongs on a *child*, not the hover target (prevents flicker).
- Buttons benefit most from having *both* hover and press feedback.
- Press scale: **0.97, not 0.9**.

*Springs & interruptibility*
- Rapid open/close must redirect smoothly, not jump.
- Be intentional — springs aren't automatically better (e.g. a bouncy accordion is wrong).

*Spatial awareness*
- Exit direction should match entry direction.
- `transform-origin` on the trigger, not center.
- Navigation direction should match the user's mental model (next slides one way, back the
  other).
- Don't start from `scale(0)` — use **0.85–0.95**.

*Hierarchy & polish*
- Not all elements deserve the same animation — vary timing by visual importance.
- **One entrance per container** — don't animate the parent *and* stagger its children.

Common named mistakes: ease-in on UI; 500ms dialog enters; transitions past 300ms; wrong
transform-origin; animating hundred-times-a-day actions; animating too much to "delight";
scale(0) starts; hover scale 1.05; shipping AI-generated motion that "works but feels
mediocre" because you couldn't tell the difference.

---

## 6. Practical animation tips (complete list)

- **Record your animations** and replay frame by frame when something feels off but you
  can't say what.
- **Fix shaky transform animations** with `will-change: transform` — prevents the 1px shift
  from GPU/CPU rendering hand-off at start/end. (RN note: Reanimated runs transforms on the
  UI thread natively; no equivalent needed.)
- **Give yourself a break** — don't code and ship in one sitting; review next day.
- **Scale buttons on press**: `scale(0.97)`, 150ms, on `:active`. Give feedback for every
  action ASAP (loading states, copy-success states); the interface should feel like it's
  listening.
- **Don't animate from `scale(0)`** — start at 0.9+ (blueprint: 0.85–0.95; Clerk's toast
  pairs an initial scale ~0.5 with opacity so the scale is barely perceptible). Deflated
  balloons still have shape; things don't materialize from nothing.
- **Don't animate subsequent tooltips** — delay + animate the first, instant thereafter.
- **Make popovers origin-aware** — `transform-origin` at the trigger, not the default
  center (Radix: `var(--radix-dropdown-menu-content-transform-origin)`; Base UI:
  `var(--transform-origin)`). RN note: no transform-origin primitive — offset the pivot by
  composing translate → scale → translate back, or anchor the popover so its scale grows
  from the trigger corner.
- **Keep animations fast** — under 300ms; 180ms > 400ms; faster spinner = faster-feeling
  load.
- **Never animate keyboard interactions.**
- **Be careful animating frequently used elements** — often best with no animation; use
  your own product daily to find which animations annoy you.
- **Hover flicker fix** — if hover moves the element off the cursor it oscillates; move a
  child element (`.box:hover .box-inner { transform: translateY(-20%) }`) so the parent's
  hit area stays put.
- **Appropriate target area** — interactive elements need a ≥ **44px** hit target (Apple
  HIG and WCAG); use a centered `::before` pseudo-element (`min-width/height: 44px`) to
  enlarge the hitbox without changing layout. RN note: use `hitSlop`.
- **ease-out for enter and exit animations.**
- **ease-in-out for elements already on screen** that move or morph.
- **Disable hover effects on touch devices** — accidental hover states confuse;
  `@media (hover: hover) and (pointer: fine)` (Tailwind v4 does this by default). RN note:
  hover only matters for pointer/web targets; gate hover styles accordingly.
- **Use custom easing curves** — built-ins are too weak (see easings.co and the course's
  curve set).
- **Use blur when nothing else works** — ~2px of blur during a crossfade masks
  imperfections and bridges the two states. (RN note: animated blur is expensive; prefer
  tight opacity crossfades, or a Skia blur if truly needed.)
- Details that go unnoticed are still worth it: they make the interface cohesive,
  predictable, and frictionless — the goal is users achieving their goals with ease, not
  the animations themselves.

---

## 7. Performance

- Target **60fps** — a frame budget of **~16.7ms** (1000/60). Below that, motion stops
  reading as fluid.
- Browser render pipeline: **Layout → Paint → Composite.**
  - `padding`, `margin`, `height`, `width` → trigger all three (layout recalc; expensive,
    may be survivable on `position: absolute` elements with few children, but don't risk it).
  - **`transform` and `opacity` → composite only. Prefer them for everything.**
  - `clip-path` is also hardware-accelerated (use it instead of width/height reveals — no
    layout shift either).
- **Hardware acceleration:** CSS and WAAPI transform animations run off the main thread and
  stay smooth no matter how busy JS is. `requestAnimationFrame`-driven JS animation (e.g.
  Framer Motion) drops frames when the main thread is busy (real case: Vercel dashboard tab
  highlight janked during page load; fixed by moving to CSS).
- **`will-change: transform`** pins the animation to the GPU and fixes the 1px CPU/GPU
  hand-off shift. Use it purposefully, not everywhere.
- **React re-renders:** never drive per-frame animation through state (a re-render per
  frame drops frames); mutate styles/shared values outside the render cycle.
- **CSS-variable gotcha:** CSS variables are inherited, so updating one per frame triggers
  style recalculation for *all* children (Vaul's drag lagged past ~20 list items); set the
  style (e.g. `transform: translateY(...)`) directly on the element instead.
- **Blur is expensive:** blur filters get laggy fast, especially on Safari — stay under
  **~20px** of blur.
- In Framer Motion, animate `transform` as a single string (rather than separate x/y) to
  get hardware acceleration.
- Measurement advice: test on slow devices, add load to the main thread and watch for
  dropped frames, record and step through frames.
- RN note: keep animations on the UI thread — Reanimated worklets, no `runOnJS` per frame,
  no `setState`-driven animation; animate `transform`/`opacity`, not layout props
  (width/height/padding trigger RN layout the same way); prefer `Layout`/entering/exiting
  presets or animated transforms over animating flexbox.

---

## 8. Accessibility

- Some users get sick (vestibular disorders) or distracted by motion; respect the OS-level
  reduced-motion preference via `prefers-reduced-motion` (`no-preference` vs `reduce`).
- **Reduced motion ≠ no animation.** Animations carry meaning; removing them entirely
  reduces understandability. Strategy per animation: **remove, reduce, or replace.**
- Guidelines when `reduce` is set:
  - Disable autoplaying animations (video, GIFs, loops).
  - Animate only non-motion properties: `opacity`, `color`, `background-color`. Nothing
    should *move* (no transforms, no layout shifts). E.g. modal scale-in becomes a fade;
    sidebar slide becomes a fade (`x` forced to 0).
- Workflow: build the animation → test with DevTools' reduced-motion emulation → ship two
  variants (normal + reduced).
- Patterns from the lesson:
  - CSS: swap `animation: bounce 0.2s` → `animation: fade 0.2s` inside the media query.
    Tailwind: `motion-safe:` / `motion-reduce:` variants.
  - Framer Motion: `useReducedMotion()` hook; or `<MotionConfig reducedMotion="user">`
    app-wide (default is `never` — you must opt in), which then animates only opacity and
    backgroundColor.
  - Smooth scrolling: enable `scroll-behavior: smooth` only under
    `prefers-reduced-motion: no-preference`.
  - Animated images: `<picture>` with animated AVIF/GIF sources gated on `no-preference`
    and a static `<img>` fallback.
  - Autoplaying video: only set `autoplay` when no preference; otherwise show paused with
    a play control.
  - Looping animations: pause on a well-chosen "hero" frame with
    `animation-play-state: paused` plus a negative `animation-delay` (e.g. `-0.4s`) to pick
    the frame (Vercel does this).
  - Explanatory motion that can't be removed: jump between discrete frames instead of
    animating through them.
- RN note: `useReducedMotion()` from Reanimated (or `AccessibilityInfo.isReduceMotionEnabled`);
  branch every entering/exiting/spring config to a fade-only variant; Reanimated also
  supports `ReduceMotion.System` on animation configs.

---

## 9. The big little details

- **Feeling / brand voice:** motion speed is a brand statement. Stripe's slow, unhurried
  marketing animations read premium and reliable; edgy agencies use aggressive ease-in-out
  curves; Vercel made product animations very fast or instant because the brand is speed;
  Sonner runs slightly slower with `ease` instead of ease-out to feel elegant. Marketing
  can be slow; product should feel fast (Family nails both).
- **Orchestration:** sequencing entrances like a wave (Paco's site; Apple's nav fading in
  columns with a slight delay) beats everything appearing at once. No formula — the delay
  has to be tuned by trial and error until it feels right. Framer Motion's stagger helps;
  it's also doable in pure CSS with per-item `animation-delay`.
- **Blur:** creates a sense of motion and masks imperfections in crossfades/morphs
  (feedback component success state, Dynamic Island).
- **Reviewing your work:** never ship the day you built it; replay daily, step away, look
  with fresh eyes. Great animations take time to review, not just to code.
- (From the vocabulary page's polish list: `tabular-nums` for animating numbers so digit
  widths don't jiggle; wipe/iris clip-path reveals; blur crossfades.)
- Animations are "proof of care" (bonus lesson): they don't exist by default, don't show in
  screenshots, and exist only in use — so tasteful motion signals uncommon care, builds
  trust, and differentiates (examples: sticker peel on Vercel Ship, Family's swipe-favorite
  confirmation, DialKit's self-presenting slider handle with rubber-banding at the bounds,
  easter eggs that reward exploration). Push one step past where most people stop.

---

## 10. Vocabulary

Terms the course defines/uses (know them; use them when prompting or discussing):

- **Easing / timing function** — how speed changes over an animation's progress.
- **Interpolation** — computing the in-between values from one state to another.
- **Entrances & exits** — how elements appear and disappear.
- **Sequencing / orchestration / stagger** — when each thing moves and in what order;
  offsetting siblings' start times.
- **Spring animation** — motion driven by physics (stiffness/damping/mass or
  duration/bounce) instead of a fixed duration.
- **Perceptual duration** — when a spring *feels* finished, though micro-motion continues.
- **Interruptibility / re-targeting** — an animation redirected mid-flight keeping its
  momentum.
- **Transforms** — translate / scale / rotate (+ 3D: rotateX/rotateY, translateZ,
  perspective, preserve-3d); **transform-origin** — the anchor point transforms act from.
- **Shared layout animation / morph** — one element (or two views) transitioning as if the
  same object, e.g. a button morphing into a form.
- **Crossfade** — old state fades out while new fades in, in place.
- **Spatial consistency** — enter and exit share a direction/place so the UI feels like one
  coherent space; "a slide says 'this came from over there,' a fade says 'this was here the
  whole time.'"
- **Perceived performance** — how fast the app *feels*, as opposed to measured speed.
- **Trackability threshold** — the speed beyond which the eye can't follow the motion.
- **Marquee** — infinite linear scroll of content.
- **Wipe / iris** — clip-path reveal shapes (rectangular sweep vs expanding circle).
- **Hardware-accelerated / compositor animation** — runs on the GPU off the main thread.
- **Layout / Paint / Composite** — the browser's rendering steps.
- **FLIP / layout projection** (the technique behind shared layout animations).
- **Reduced motion** — the OS accessibility preference for less movement.
- **Taste gap** — your judgement outpacing your ability while learning.

---

## 11. Interruptibility & the future (fluid interfaces)

- Treat the interface as **one constantly evolving space where any element can transform
  into another** — not a series of disconnected screens. Buttons morph into forms; deleted
  items are *thrown* into the trash rather than teleporting.
- Morphing text (Torph-style character morphs) adds fluidity *and* draws attention to a
  change — sometimes being noticeable is the point (a button whose consequence changed).
- Fluidity improves perceived speed: Family's animated graph transition feels faster than
  CashApp's static one at the same real load time.
- Fluid interfaces must be planned **before** designing the UI — elements are positioned
  and styled so transitions can be seamless.
- They're expensive to build; only invest once core features/bugs are solid, or the polish
  is overshadowed. Rare today, but this is where great UI animation is heading.
- Interruptibility is a prerequisite of fluidity: springs carry velocity through
  re-targeting; CSS transitions are interruptible, CSS keyframe animations are not
  (Sonner's stacked-toast jump). Rapid open/close toggling is the standard stress test.
- RN note: this is Reanimated's home turf — springs re-target naturally; use shared
  values + gestures so any in-flight motion can be grabbed, redirected, or reversed.

---

## 12. CSS specifics worth keeping (concepts transfer to RN)

**Transforms**
- `translate` percentages are relative to the element's own size — `translateY(100%)`
  always moves it by its own height (how Sonner and Vaul stay size-agnostic). Prefer
  percentages over hardcoded px. (RN note: no percentage transforms — measure with
  `onLayout`/`measure` and translate by the measured value.)
- `scale` multiplies children too (text, icons, border-radius) — usually what you want for
  presses and zooms; `width`/`height` don't.
- **Order of transforms matters**: `rotate() translateX()` ≠ `translateX() rotate()` —
  rotation changes the axis the translation happens along. (RN note: same rule for the
  `transform` array order.)
- 3D: `rotateY` = revolving door, `rotateX` = rotisserie; `translateZ` needs `perspective`
  on the parent to be visible (smaller perspective = stronger effect; example value 450);
  `transform-style: preserve-3d` keeps children in 3D space. Enables coin-flip/orbit
  effects with plain CSS.
- Transforms (and clip-path) don't affect document flow/layout — the DOM box stays put.

**Transitions**
- Shorthand = property, duration, timing-function, delay (e.g.
  `transition: transform 0.2s ease`). Default duration mental model: 0.2s ease.
- Avoid `transition: all` — be explicit about properties so an unrelated property change
  doesn't animate. For several properties with shared timing:
  `transition: 0.2s ease; transition-property: color, background-color, border-color;`
- Write `transition-delay` separately — the 4-value shorthand is hard to read.
- Transitions are **interruptible** (hover-out mid-transition reverses smoothly) — the
  reason to choose them over keyframes for user-triggered state changes.

**Keyframes vs transitions**
- Keyframes when: infinite loops (marquee — e.g. `26s linear infinite`; spinners),
  auto-running animations (page intros), multi-step sequences (pulse, blink), or simple
  enter/exits that never need interruption (dialog, popup).
- Transitions when: user interaction triggers the change, or you need smooth interruption
  (toast stacks).
- Keyframe patterns: omit 0%/100% frames to inherit the element's natural state (blink is
  just `50% { visibility: hidden }`); `animation-fill-mode: forwards` to keep the end
  state (dialogs/popovers), `backwards` to apply the first frame during a delay;
  `animation-direction: alternate` for back-and-forth loops;
  `animation-play-state: paused` (+ negative `animation-delay` to freeze on a chosen
  frame); `animation-iteration-count: infinite` (values between 1 and infinite are rarely
  useful).
- Complex multi-step motion is usually easier in a JS library than in giant keyframe
  blocks.

**clip-path techniques** (all composite-only, no layout shift)
- `inset(top right bottom left)` hides parts of an element: `inset(0 0 100% 0)` → hidden
  from the bottom; animate to `inset(0 0 0 0)` for an image reveal (1s,
  `cubic-bezier(0.77, 0, 0.175, 1)`), triggered once when scrolled into view.
- Comparison sliders: two stacked images, animate the top one's inset with drag position.
- **Active-tab highlight:** duplicate the tab list styled as "active", clip it to just the
  active tab (`inset(0 75% 0 0 round 17px)`), and animate the inset on tab change — a
  seamless pill + text-color transition that color-transitions alone can't match (seen at
  Stripe, Vercel).
- Hold-to-delete: a linear clip-path sweep visualizes elapsed hold time (colors used:
  `#FFDBDC` bg, `#E5484D` text).
- Theme-switch reveals and text masks are the same trick; View Transitions API can replace
  the duplicate-element hack.
- RN note: closest equivalents — animated `overflow: hidden` containers, MaskedView, or
  Skia clip rects/paths; the duplicated-layer + animated-clip idea maps directly to Skia.

**When CSS vs a JS animation library** (web framing, but the decision transfers)
- CSS-only for: simple hovers, simple enter/exit, infinite linear loops, bundle-sensitive
  projects. Library for: complex/sophisticated motion, springs, interruptibility, shared
  layout animations. Users don't care which you used — only how it feels.

---

## Source lessons

| Section | Course files |
|---|---|
| 1. What makes an animation feel right | `animation-theory__what-makes-an-animation-feel-right.txt`, `animation-theory__intro.txt` |
| 2. Easing blueprint | `animation-theory__the-easing-blueprint.txt`, `animation-theory__timing-and-purpose.txt`, `animation-theory__practical-animation-tips.txt` |
| 3. Springs | `animation-theory__spring-animations.txt`, `good-vs-great-animations__accessibility.txt` (spring config example) |
| 4. Timing & purpose | `animation-theory__timing-and-purpose.txt`, `animation-theory__practical-animation-tips.txt` |
| 5. Taste & judgement | `animation-theory__taste.txt`, `animation-theory__train-your-judgement.txt`, `animation-theory__animations-and-ai.txt` |
| 6. Practical animation tips | `animation-theory__practical-animation-tips.txt` |
| 7. Performance | `good-vs-great-animations__performance.txt`, `css-animations__the-beauty-of-css-animations.txt` |
| 8. Accessibility | `good-vs-great-animations__accessibility.txt` |
| 9. The big little details | `good-vs-great-animations__the-big-little-details.txt`, `bonuses__animations-as-proof-of-care.txt`, `vocabulary.txt` |
| 10. Vocabulary | `vocabulary.txt`, terms defined across `animation-theory__*` and `css-animations__transitions.txt` |
| 11. Interruptibility / future | `good-vs-great-animations__animations-of-the-future.txt`, `animation-theory__spring-animations.txt` |
| 12. CSS specifics | `css-animations__transforms.txt`, `css-animations__transitions.txt`, `css-animations__keyframe-animations.txt`, `css-animations__the-magic-of-clip-path.txt`, `css-animations__the-beauty-of-css-animations.txt` |
| (Context: prototyping workflow, AI usage, official skills) | `animation-theory__prototyping-interfaces.txt`, `animation-theory__animations-and-ai.txt`, `skills.txt` |
