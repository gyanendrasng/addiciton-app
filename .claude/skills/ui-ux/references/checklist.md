# Review checklist

Run this against a screenshot of the real screen, not against the code. A screen is not done until every line passes or has a written reason.

## Look at it

- [ ] Screenshotted on the iOS simulator (maestro MCP), in **dark and light**.
- [ ] Screenshotted **with the keyboard up** if it has any input.
- [ ] Checked at the largest Dynamic Type size — nothing clipped, nothing overlapping.

## Layout

- [ ] Content is anchored, not floating in vertically-centred dead space.
- [ ] Heading block, content and actions read as three distinct groups (32pt between groups, 8–16 within).
- [ ] Side margins are `Spacing.four` (24) and consistent with every other screen.
- [ ] Safe-area insets used on every edge drawn to; no hard-coded status-bar or home-indicator height.
- [ ] Primary action is in the bottom third and full-width.
- [ ] Nothing important sits under the keyboard, the tab bar or the home indicator.

## Type

- [ ] Every size/weight/colour comes from the type scale in `foundations.md`.
- [ ] Hierarchy is carried by colour and weight first, size last — and the size steps are big.
- [ ] Left-aligned, unless it's a genuine hero.
- [ ] Ticking numbers use `tabular-nums`.
- [ ] Sentence case. No Title Case, no ALL CAPS except the 12pt eyebrow.

## Colour

- [ ] Every colour is from `palette` / `hues`. No literal hex in the screen file.
- [ ] **No gradients, no glow, no glass.**
- [ ] One accent for the primary action; at most one additional hue, carrying a real meaning.
- [ ] Every text/background pair computed against WCAG AA (4.5:1, or 3:1 for large). Actually computed.
- [ ] Meaning is never colour-only — every hue is paired with a glyph or a word.
- [ ] One radius per element class; no accidental mix of 12/14/16 on sibling elements.

## States

- [ ] **Loading** — inline on the pressed control; nothing under ~300ms; screen never goes blank.
- [ ] **Empty** — explains what goes here and offers the first action.
- [ ] **Error** — a written sentence via `humanError()`, in a `Notice`, with a retry; user input preserved.
- [ ] **Success** — confirmed in place; ceremony only where it's earned.
- [ ] Disabled controls look disabled *and* do nothing.
- [ ] No raw exception text, no `undefined`, no `[object Object]` reachable anywhere.

## Interaction

- [ ] Every tappable thing is at least 44×44pt, with 8pt between neighbours.
- [ ] Every tap gives feedback within 100ms (`Tap` handles this — use it).
- [ ] Destructive actions confirm; the loaded one (logging a slip) is undoable.
- [ ] Every modal has a visible dismiss, and the back gesture does the same thing.
- [ ] Double-tapping the primary action can't submit twice.

## Copy

- [ ] Read out loud without wincing.
- [ ] Heading names the one job of the screen.
- [ ] Buttons are verbs.
- [ ] No exclamation marks, no emoji, no "Oops", no "Awesome".
- [ ] No overclaiming — no promised outcomes, no cures.
- [ ] Nothing shaming. A slip is a lapse. No red on the relapse flow.
- [ ] Any privacy claim is exactly true: "your recovery data never leaves your device", never "nothing leaves your device".

## Accessibility

- [ ] `accessibilityRole` + `accessibilityLabel` on controls whose visible text isn't enough.
- [ ] No `accessibilityLabel` on a container that masks children you need readable (it breaks screen readers *and* UI tests).
- [ ] Errors and status use `accessibilityLiveRegion="polite"`.
- [ ] `useReducedMotion()` honoured — fade instead of move, never nothing.

## Motion

- [ ] Meets the `animation` skill: ease-out for entrances, never ease-in, exits faster than entrances, interactive motion under 300ms.
- [ ] One hero per screen; one entrance per container.
- [ ] Nothing moves at rest.

## Build

- [ ] `npx tsc --noEmit` clean.
- [ ] `npx expo lint` clean — zero errors *and* zero warnings.
