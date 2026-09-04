# Curb

A multi-addiction recovery app. Three parts:

- `app/` — the Expo app (SDK 57, expo-router, Reanimated 4). Local-first: recovery
  data lives in on-device SQLite and never leaves the phone.
- `website/` — Next.js 16 on Vercel. The marketing site, the legal pages, and the
  auth + entitlement backend (Better Auth on Drizzle/Postgres).
- `brand/` — the app icon and wordmark. `docs/` — research and submission notes.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. Same rule for every other dependency: check the docs for the
version in `package.json`, not from memory.

## Skills — load these before writing UI

This app competes on how it looks and feels. Two skills carry that standard, and
they are not optional:

- **`.claude/skills/ui-ux/SKILL.md`** — visual and interaction design: layout,
  type scale, colour and contrast, hierarchy, component anatomy, the four states
  every screen owes the user (loading / empty / error / success), copywriting,
  accessibility, and the review checklist a screen must pass.
  References: `foundations.md` (the numbers), `heuristics.md` (Laws of UX +
  Nielsen), `patterns.md` (component anatomy), `checklist.md` (pass/fail review).

- **`.claude/skills/animation/SKILL.md`** — motion: easing, springs, timing,
  orchestration, and per-screen recipes.
  References: `principles.md`, `techniques.md`, `course/*.txt`.

**Load both before building or changing any screen, component or piece of copy.**
Then run the checklist against a screenshot of the real screen — never declare a
screen finished from reading the code.

## Hard constraints

- **Flat colour only.** No gradients, no glow, no glassmorphism.
- **Contrast is computed, not eyeballed.** WCAG AA: 4.5:1 for body text, 3:1 for
  large text and meaningful icons.
- Every colour from `app/src/theme/palette.ts`, every gap from `spacing.ts`,
  every font from `type.ts`. The brand mark is the one deliberate exception.
- **Never surface a raw error.** Everything user-facing goes through
  `app/src/lib/errors.ts`.
- **What the user WRITES never leaves the device** — journal and check-in notes,
  reasons, slip notes. That is the claim the app is sold on, and the only one
  that is true. Structured progress data (habits tracked, streak lengths, slip
  counts) IS sent to analytics, along with the account email and subscription
  status. Never write "your recovery data never leaves your device" or
  "no servers" — both are false. `website/src/app/privacy/page.tsx` §3 is the
  authority; keep the code and that section in agreement.
- Time is read through `app/src/lib/clock.ts`, never `Date.now()` directly.

## Verifying

- App: `npx tsc --noEmit` and `npx expo lint` (zero errors *and* warnings), then
  the iOS simulator via the `maestro` MCP — `list_devices`, then `run` a flow
  with `takeScreenshot`, then read the PNG.
- Website: `npx tsc --noEmit`, `npx eslint .`, `npx next build`, and the
  `playwright` MCP for the rendered page.
- npm/npx on this machine needs `NODE_OPTIONS="--network-family-autoselection-attempt-timeout=3000"`
  or requests time out behind the VPN.
