# Foundations — the numbers

Sources: Apple Human Interface Guidelines (iOS), WCAG 2.1 AA, Refactoring UI (Wathan & Schoger), Material Design 3.

## Tap targets

- **44 × 44 pt minimum** for every control (Apple HIG). This is the *touchable* area, not the visible one — a 24pt icon needs 10pt of padding on each side.
- WCAG 2.5.8 sets 24 × 24 CSS px as the web floor; 44 is the standard this app holds to on both platforms.
- Keep 8pt of clear space between adjacent targets so a fat thumb can't hit two.
- **Fitts's Law:** time to hit a target scales with distance ÷ size. The most-used action is the biggest and the closest to the thumb.

## Spacing

`src/theme/spacing.ts` — an 8pt rhythm with a 4pt half-step:

```
half 2 · one 4 · two 8 · three 16 · four 24 · five 32 · six 64
```

- **Screen side margins: 24** (`Spacing.four`). Apple's own layout margins are 16–20; 24 reads more generous and matches this app's display type.
- **Gap inside a group: 8–16.** Gap between groups: **32**. The jump between those two numbers is what makes grouping legible (Law of Proximity — proximity does more for grouping than any border).
- Start with **too much** white space and remove it. Cramped is the more common failure.
- Never invent a value. If nothing in the scale fits, the layout is wrong.

## Type scale

`src/theme/type.ts` — Bricolage Grotesque for display, Figtree for body.

| Role | Size / line-height | Family | Colour |
|---|---|---|---|
| Screen heading (h1) | 32 / 37, tracking −0.7 | display | `text` |
| Section heading | 22 / 27, tracking −0.4 | display | `text` |
| Card title | 17 / 22 | bodySemi | `text` |
| Body | 15 / 22 | body | `text` or `textDim` |
| Row label | 15 / 20 | bodySemi | `text` |
| Row subtitle | 13 / 18 | body | `textDim` |
| Eyebrow / label | 12 / 16, tracking +1.4, uppercase | bodySemi | `accent` or `textDim` |
| Fine print | 12 / 17 | body | `textFaint` |

Apple's own reference points, for calibration: body 17pt, secondary 15pt, titles 17–34pt.

- **Numbers that tick use `fontVariant: ['tabular-nums']`** so digits don't jitter.
- **Line height ≈ 1.4× body, ≈ 1.15× display.** Tight leading on big type is what makes it look designed.
- **Negative tracking on display sizes, positive on small caps.** Big type set at default tracking looks loose.
- Support Dynamic Type where practical; at minimum, never clip or truncate at the largest setting.

## Hierarchy ladder — use in this order

From Refactoring UI: create emphasis *without* reaching for font size first.

1. **Colour.** `text` → `textDim` → `textFaint` is three levels of hierarchy at one size.
2. **Weight.** `bodySemi` vs `body` separates a label from its value.
3. **Size.** Last resort, and in big steps — 15 → 17 is noise, 15 → 32 is hierarchy.
4. **De-emphasise to emphasise.** If the primary won't stand out, dim its neighbours instead of enlarging it.

## Colour

Roles live in `src/theme/palette.ts`. Both themes are defined; the active one resolves synchronously at launch.

```
bg → surface → surface2 → surface3     ground to raised, four steps
line                                    hairline borders
text → textDim → textFaint              three text levels
accent / accentInk / accentWash         the one primary action colour
amber / amberWash                       caution, urge prompts
danger                                  destructive only
hues.{pledge,urge,checkin,reasons,progress}   semantic, one meaning each
```

Rules:

- **One accent per screen** for the primary action. A second hue only when it carries specific meaning.
- **Flat fills only.** No gradients — depth comes from the surface ladder plus a `line` hairline.
- **Prefer fewer borders** (Refactoring UI): separate with a surface step or with space before reaching for a stroke.
- Washes are the accent at 12–16% alpha, used behind icon chips — never as a large field.
- Semantic hues keep their meaning: green is progress, orange is urge. Don't decorate with them.

### Contrast is computed

Every text/background pair must clear WCAG AA:

- **4.5:1** for text below 18pt regular / 14pt bold
- **3:1** for text at or above that, and for meaningful icons and boundaries

Check it, don't judge it — a saturated colour can look bright and still fail. Relative luminance:

```python
def lum(hexcolor):
    h = hexcolor.lstrip('#')
    parts = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in parts]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
```

Calibrating an accent on a near-black ground: aim for **8–11:1**. Below ~6:1 it reads muddy; above ~12:1 on pure black it glares. On a light ground, the same accent must be *much* darker to clear 4.5:1 — this app's pair is `#31C983` (dark, 9.8:1 on black) and `#0A7A4E` (light, 4.6:1 on `#ECEFED`). One hue, two calibrated values.

To fix a failing colour, walk its HSL lightness toward the needed ratio rather than picking a new hue — that keeps the palette coherent.

## Radii

```
chip / icon wash   0.3 × size
input, notice      14–16
button             16 (or full pill: height / 2)
card               18–20
app-icon tile      0.28 × size   (matches iOS squircle closely enough)
```

Pick one radius per element class and keep it. Mixed radii is the most common tell of an unconsidered UI.

## Elevation

This app is flat. Depth order, cheapest first:

1. **Surface step** — `surface2` on `bg`.
2. **Hairline** — 1px `line`.
3. **Space** — more gap than the neighbours have.
4. **Shadow** — rare, and only on genuinely floating things (sheets). If used: two parts, a tight dark one and a wide soft one; never a coloured glow.

## Motion

Owned by the `animation` skill. The one number to remember here: **Doherty Threshold — keep interaction response under 400ms** or the app feels like it's thinking.
