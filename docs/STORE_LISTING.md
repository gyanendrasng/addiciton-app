# Store listing copy — Curb

One source for both stores. Character limits are Apple's unless noted; Play's
are more generous, so anything that fits Apple fits Play.

Written to the same rules as the app: no exclamation marks, no promised
outcomes, no medical claims, nothing that says "cure". Apple rejects
overclaiming in health-adjacent apps, and every sentence here has to survive a
reviewer asking "can you prove that?"

---

## App name — 30 chars

```
Curb — Quit Any Addiction
```
25 chars. "Curb" alone was taken. The extra words aren't padding: **Apple
indexes the full name field for search**, so this buys "quit" and "addiction"
as ranking terms.

## Subtitle — 30 chars

```
Quit tracker for any habit
```
25 chars. Live in App Store Connect. Leads on the multi-addiction angle — "any
habit" is the differentiator against single-vice competitors.

Alternatives held in reserve: `Streak tracker & urge toolkit` (29, adds two more
indexed terms) · `Track streaks, ride out urges` (29)

## Keywords — 100 chars, comma-separated, no spaces

```
sober,craving,recovery,nofap,smoking,alcohol,vaping,weed,gambling,relapse,counter,streak,urges,porn
```
99 chars. **Tuned to the subtitle that actually shipped.** Apple indexes name +
subtitle + keywords as one pool, so "quit", "tracker", "habit" and "addiction"
are absent — they're already in the name and subtitle, and a repeated word earns
nothing twice. That frees the slots for "streak" and "urges", which the current
subtitle no longer covers.

If the subtitle ever changes to `Streak tracker & urge toolkit`, swap "streak"
and "urges" back out for "habit" and "quitting".

No spaces after commas (each space costs a character). No plurals where Apple
already stems them.

## Promotional text — 170 chars

Changeable **without a review**, unlike the description — use it for seasonal
or A/B copy.

```
No free tier, no ads, no feed. One subscription, everything unlocked, and a
plan for the two minutes when an urge hits.
```

## Description — 4000 chars

```
Curb is a recovery companion for whatever you're trying to stop — porn,
alcohol, smoking, vaping, weed, social media, gambling, or something you'd
rather not name.

Most quitting apps count days. Curb is built for the moment the count is about
to break.

WHEN AN URGE HITS
Open the urge toolkit and work through it: box breathing, a two-minute delay
timer, your own written reasons put in front of you, and a game to occupy your
hands until it passes. It knows the hour you said urges are worst, and says so.

A STREAK FOR EVERY HABIT
Quitting two things at once shouldn't mean one slip erases both. Every habit
you track gets its own independent count.

SLIPS WITHOUT SHAME
Logging a slip takes three taps, uses no red, and calls it a lapse. Your total
clean days never reset — they're a record of everything you've done, not a
scoreboard you can lose. And you have 24 hours to undo it.

WHAT THE DAYS ARE WORTH
See the money you haven't spent and the hours you've got back, from your own
figures. See what tends to happen in the body and mind after stopping, drawn
from public health guidance, with your own progress marked against it.

THE DAILY LOOP
A morning pledge. An evening check-in with mood and difficulty. Milestones at
1, 3, 7, 14, 30, 45, 60, 90, 120 and 365 days. A calendar and mood trend once
you have enough history.

BUILT FOR 2AM
Dark and light themes. Reminders you control. No feed, no followers, nothing
to perform.

Curb is a self-tracking tool, not treatment and not medical advice. If you are
physically dependent on alcohol or benzodiazepines, stopping suddenly can be
dangerous — talk to a doctor about how to withdraw safely. Crisis and support
lines are built into the app.
```

## URLs

| Field | Value |
|---|---|
| Support URL | `https://joincurb.app/support` |
| Marketing URL | `https://joincurb.app` |
| Privacy Policy URL | `https://joincurb.app/privacy` |

## Category

**Primary: Health & Fitness.** Secondary: Lifestyle.

**Not Medical.** That category invites a different review track and stricter
claims scrutiny, and Curb isn't a medical app — its own disclaimer says so.

## Age rating

Answer the questionnaire honestly rather than aiming for a number. The
questions that apply:

- **Alcohol, Tobacco, or Drug Use or References** — yes, infrequent/mild. The
  app names these habits; it doesn't depict use.
- **Sexual Content or Nudity** — **no.** Curb lists "porn" as a habit to quit
  and shows no sexual content of any kind. Don't over-answer this one; it's the
  difference between 12+ and 17+.
- **Medical/Treatment Information** — no. It tracks; it doesn't advise.

Expect 12+. Apple moved to 4+/9+/13+/16+/18+ in July 2025, so the exact label
may differ.

## Review notes (App Review Information)

```
Curb is subscription-only with no free tier, so the paywall appears
immediately after onboarding. A demo account is not required — a reviewer can
create one with any email; the sign-in code is delivered by email.

Sign in with Apple, Google, and email code are all supported.

The app stores recovery entries on the device. The account exists only to
carry the subscription across devices.

Crisis lines and a medical disclaimer are in Settings → Support → Get help,
and are reachable without a subscription.
```

Filling that in preempts the two questions reviewers ask about paywalled
health apps: how do I get in, and where's your safety information.

---

## Play differences

Play splits the description in two:

- **Short description** — 80 chars:
  ```
  Beat urges, keep your streak, and log slips without the shame.
  ```
- **Full description** — 4000 chars: the description above works as-is.

Play also needs a **feature graphic** at 1024×500, which Apple has no
equivalent of.

---

## In-App Purchase metadata

One subscription group, three products. Ids must match
`app/src/features/premium/plans.ts` exactly — a typo here is a purchase that
silently fails in production.

**Subscription Group** — reference name `Curb Premium`, display name
`Curb Premium`. The display name is what users see in Settings → Subscriptions
on their phone, so it has to read as a product, not a SKU.

| Product ID | Duration | Price | Display Name (30) | Description (45) |
|---|---|---|---|---|
| `curb.premium.weekly` | 1 week | $9.99 | Curb Premium Weekly | Full access, billed every week. |
| `curb.premium.monthly` | 1 month | $14.99 | Curb Premium Monthly | Full access, billed every month. |
| `curb.premium.yearly` | 1 year | $59.99 | Curb Premium Yearly | Full access, billed once a year. |

No introductory offers and no free trial — that's a product decision, and the
paywall copy in `plans.ts` states the price and renewal on every plan to satisfy
3.1.2.

**Review screenshot** (required per product): a capture of `/paywall` from a
real build. The same image can be reused for all three.

**Review notes** per product:
```
Curb has no free tier. The paywall appears immediately after onboarding and
this product unlocks the full app. Sign in with any email to reach it.
```

