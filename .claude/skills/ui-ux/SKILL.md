---
name: ui-ux
description: Visual and interaction design standards for this app — layout, type scale, colour and contrast, hierarchy, component anatomy, empty/loading/error states, copywriting, accessibility, and the review checklist a screen must pass. Use whenever building or changing any screen, component, or piece of copy in app/ or website/. Load this together with the `animation` skill before writing UI code.
---

# UI & UX Standards

This app is judged on whether it looks like someone cared. The bar is an Apple Design Award finalist in **Interaction** and **Visuals & Graphics** — "intuitive interfaces and effortless controls perfectly tailored to their platform" and "skilfully drawn interfaces with a unique and cohesive theme".

Pair this with the `animation` skill (motion) — that one covers how things move, this one covers how they look and read.

**References:**
- `references/foundations.md` — the numbers: type scale, spacing, tap targets, contrast, radii, elevation.
- `references/heuristics.md` — Laws of UX and Nielsen's heuristics, with what each one means *for this app*.
- `references/patterns.md` — component anatomy and the four states every screen owes the user.
- `references/checklist.md` — the pass/fail review run before calling a screen done.

## The five failures that make an app look "vibe-coded"

Every rejection of this app's UI so far has been one of these. Check for them first.

1. **Everything centred and floating.** Content vertically centred in dead space, no anchor. Real apps anchor: heading near the top, actions near the bottom thumb zone, content filling the middle.
2. **Gradients and glow.** This app uses **flat colour only**. No linear gradients, no radial glows, no glassmorphism, no neon shadows. Depth comes from surface steps and hairlines.
3. **One-colour monotony, or confetti.** Either every element is the same accent, or six hues fight. Use one accent per screen for the primary action, plus at most one semantic hue for a specific meaning.
4. **Type with no hierarchy.** Three sizes all at the same weight and colour. Hierarchy comes from *weight and colour first*, size last (see foundations).
5. **Raw system output.** `UnexpectedException: A TLS error…`, `undefined`, a bare spinner with no context, an empty list with no explanation. Every failure gets a written sentence (see patterns → the four states).

## Non-negotiables

- **Flat colour. No gradients.** Stated by the user repeatedly; treat as a hard constraint.
- **Contrast is computed, not eyeballed.** Every text/background pair must clear WCAG AA: **4.5:1** for text under 18pt regular (or 14pt bold), **3:1** above it. Run the checker in `references/foundations.md` before shipping a new colour.
- **44×44pt minimum** for anything tappable, always, including icon-only buttons.
- **The keyboard must never cover the control that dismisses it.** Any screen with a `TextInput` gets `KeyboardAvoidingView` and is tested with the keyboard up.
- **Safe areas on every edge you draw to.** Never hard-code a status-bar or home-indicator height.
- **Every colour comes from `src/theme/palette.ts`**, every gap from `src/theme/spacing.ts`, every font from `src/theme/type.ts`. A literal hex or a magic `padding: 13` in a screen file is a bug — the sole exception is the brand mark, which is deliberately palette-independent.
- **Copy is part of the design.** Write the words before the layout. If the sentence is bad, the screen is bad. See patterns → voice.

## How to build a screen

1. **Name the one job.** What is the single thing the user came here to do? That gets the largest type and the primary button. Everything else is subordinate or cut. (Nielsen 8: aesthetic and minimalist design.)
2. **Write the copy.** Heading, one supporting sentence, button label, and the error and empty text. Out loud.
3. **Structure top to bottom.** Heading block → content → spacer → actions → fine print. Left-aligned unless there is a reason; centred text reads as a marketing page, not a tool.
4. **Assign the hierarchy** with weight and colour (foundations → hierarchy ladder), then size.
5. **Place actions in the thumb zone** — bottom third, full-width, primary last so it's closest to the thumb (Fitts's Law).
6. **Write the four states** before the happy path is "done": loading, empty, error, success (patterns).
7. **Then add motion**, per the `animation` skill. One hero per screen.
8. **Run the checklist** in `references/checklist.md`.

## This app's specific voice and mood

It is a recovery app. Someone opens it at 2am mid-urge.

- **Calm, not clinical. Direct, not chirpy.** No exclamation marks, no "Oops!", no emoji in UI copy.
- **Never shame.** A slip is "a lapse", never "failure". Relapse UI uses no red and no danger colouring.
- **Never overclaim.** Don't promise rewiring, cures or outcomes. Say what the app does.
- **Privacy is the product.** Where data is involved, say precisely what leaves the device — and never say "nothing leaves your device", because purchases and updates do. The accurate line is "your recovery data never leaves your device".
- **Green means progress, orange means urge, and nothing else.** The hue set in `palette.hues` is semantic; don't decorate with it.

## Verifying, not guessing

Never declare a screen good from the code. Look at it.

- iOS simulator via the `maestro` MCP: `list_devices` → `run` a flow with `takeScreenshot` → read the PNG.
- Test with the keyboard up, in **both** themes, and at the largest Dynamic Type size.
- Web preview via the `playwright` MCP for the Next.js site.
