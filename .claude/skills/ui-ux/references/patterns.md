# Patterns — anatomy and states

## Screen skeleton

Every screen in this app is one of two shapes.

**Task screen** (sign-in, check-in, relapse, paywall) — anchored, actions at the bottom:

```
safe-area top
  bar          44pt, dismiss control only
  heading      h1 + one supporting sentence          ← the one job
  content      the fields, options or explanation
  spacer       flex: 1, minHeight 24
  actions      primary last (nearest the thumb), then ghost, then fine print
safe-area bottom
```

**Browse screen** (home, progress, settings, games) — scrolling, header at the top:

```
safe-area top
  eyebrow      12pt uppercase, tinted
  heading      h1
  content      cards / sections, 32pt between groups
  ...scrolls
tab bar
```

Left-align both. Centre only a genuine hero (the streak number, a celebration) — centred body text reads as a landing page.

## The four states every screen owes the user

Writing only the happy path is how a screen ends up shipping a bare spinner and an `undefined`. All four before "done".

**1. Loading.** Never a naked full-screen spinner if you can avoid it.
- Under ~300ms: show nothing. A flash of spinner is worse than a pause.
- Inline: the busy state goes on the control that was pressed (`ActivityIndicator` inside the button, label to "Sending…").
- Whole screen: keep the heading visible and load the content beneath it, so the screen never goes blank.

**2. Empty.** An explanation and a way out, never a blank area.
- One line saying what goes here, one line saying how to add the first one, and the action.
- "No reasons yet." + "Add the reasons you started — they'll show up when an urge hits." + `Add a reason`.
- Distinguish *empty* from *loading* from *filtered-to-nothing*; they need different words.

**3. Error.** A sentence, in a `Notice`, with a way to retry.
- Route every message through `humanError()` (`src/lib/errors.ts`). No raw exceptions, ever.
- Say what failed and what to do: "Couldn't reach Curb. Check your connection and try again."
- Keep the user's input. Never clear a form because the request failed.
- Errors appear next to the thing that failed, not as a global alert, unless the whole screen is unusable.
- Offline is not an error state for local data — this app is local-first. Only network features can fail.

**4. Success.** Confirm without ceremony, except where ceremony is earned.
- Small: the control changes state ("Pledged ✓"), plus a success haptic.
- Big (milestone, urge survived): the celebration screen. See the `animation` skill.
- Never a toast that says "Success".

## Components — use these, don't fork them

| Need | Component |
|---|---|
| Anything tappable | `components/ui/tap.tsx` — handles press feedback + haptics |
| Grouped content | `components/ui/card.tsx` |
| Screen shell | `components/ui/screen.tsx` |
| Icon in a tinted square | `components/ui/symbol-chip.tsx` |
| Error / caution / info message | `components/ui/notice.tsx` |
| Brand mark | `components/ui/app-logo.tsx` |
| Apple / Google sign-in marks | `components/ui/brand-marks.tsx` |
| Heading, subtitle, eyebrow, CTA, chevron | `features/onboarding/components/chrome.tsx` |

Adding a second component that does an existing job is a bug. Extend the existing one with a prop.

### Settings-style row

The pattern used across Settings and Account, and the default for any list of options:

```
[SymbolChip 30–32]  Label (15 bodySemi)          [value / chevron / switch]
                    Subtitle (13 body, textDim)
```

- Rows live inside a `Card` with `padding: 0` and a 1px `line` separator inset to the text (`marginLeft: 54`).
- The whole row is the tap target, not just the label.
- Subtitles carry the explanation so no row needs a help icon.

### Buttons

- **Primary:** filled `accent`, `accentInk` label, height 54–56, radius 16, full width. One per screen.
- **Secondary:** `surface2` fill with a `line` border, `text` label.
- **Ghost:** text only in `textDim`, centred, 44pt tall touch area.
- **Destructive:** `danger` label on a normal surface. Never a filled red button — the confirm alert carries the weight.
- Disabled is `opacity: 0.4` **and** a no-op handler. Never a button that looks live and does nothing.
- Third-party auth buttons are **not ours to design**. Use `components/ui/provider-buttons.tsx`, never a hand-rolled one — see below.

### Sign-in provider buttons (vendor specs, not preferences)

These two controls are most of what decides whether an auth screen reads as
native or home-made. Both vendors publish rules, and both gate App Review.

**Apple** — Sign in with Apple → Buttons (HIG):
- Display it prominently and **no smaller than any other sign-in button**.
- Never make the user scroll to reach it.
- Titles allowed: *Sign in with Apple*, *Sign up with Apple*, *Continue with Apple*. Nothing else.
- Prefer Apple's own `AppleAuthenticationButton`; it supports `cornerRadius`, so it can match the app's radius. Custom buttons must set the logo height equal to the button height, with no cropping and no vertical padding.
- `isAvailableAsync()` reports false when the device has **no Apple ID signed in** — common on a fresh Simulator, and fixable in its Settings. Sign in with Apple itself *does* work on the Simulator. Only `getCredentialStateAsync()` always throws there. Don't refuse the attempt on a false availability check; try it, and if it fails say the device needs an Apple ID.

**Google** — Sign in with Google branding guidelines, exact values:

| | fill | 1px inside stroke | text |
|---|---|---|---|
| dark | `#131314` | `#8E918F` | `#E3E3E3` |
| light | `#FFFFFF` | `#747775` | `#1F1F1F` |
| neutral | `#F2F2F2` | none | `#1F1F1F` |

- Type is Google Sans Medium 14/20. Google Sans can't be bundled, so use the **platform system face** — the app's brand font is not an option on this button.
- The four-colour G may never be resized or recoloured.
- Titles allowed: *Sign in with Google*, *Sign up with Google*, *Continue with Google*. Rectangular or pill.

The trap: theming these from `palette` so they "match the app". That is exactly
what makes an auth screen look generic — they are supposed to look like Apple's
and Google's buttons, not like ours.

### Inputs

- Height 56, radius 16, `surface2` fill, 1px `line` border, 16pt inner padding.
- `placeholderTextColor: palette.textFaint` — never let the platform pick.
- Always set `keyboardType`, `autoCapitalize`, `autoComplete`, `textContentType`, `returnKeyType` and `onSubmitEditing`. A one-time code field gets `autoComplete="one-time-code"` so iOS offers it from the message.
- `KeyboardAvoidingView` on any screen with an input, and dismiss the keyboard before submitting.
- Validation on submit, not on every keystroke. Nobody wants to be told their email is invalid while typing it.

## Voice

- **Sentence case** everywhere. Never Title Case, never ALL CAPS except the 12pt eyebrow.
- **Second person, present tense.** "Your streaks stay on this device."
- **Headings are statements or plain questions.** "Keep your premium on every device." / "What's your email?" Full stop on statements — it reads deliberate.
- **Buttons are verbs.** "Send code", "Sign in", "Start again". Never "OK", never "Submit".
- **One idea per sentence**, and no sentence longer than about 90 characters in body copy.
- **No exclamation marks. No emoji. No "Oops".** No "Awesome!". No em-dash-joined marketing clauses stacked three deep.
- **Numbers as digits** ("6-digit code"), except at the start of a sentence.
- Say what a thing does, not how it feels: "Restore in one tap instead of paying twice", not "Seamlessly sync your journey".

## Accessibility

- `accessibilityRole` and `accessibilityLabel` on every control whose visible text isn't sufficient (icon-only buttons especially).
- Beware: an `accessibilityLabel` on a container **masks its children** from the accessibility tree — which also breaks UI tests that match on the child's text.
- `accessibilityLiveRegion="polite"` on error and status text so it's announced.
- Honour `useReducedMotion()` — fade instead of move; never remove the feedback entirely.
- Never encode meaning in colour alone; pair every hue with a glyph or a word.
- Test at the largest Dynamic Type size: nothing clipped, nothing overlapping.
