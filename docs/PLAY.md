# Google Play submission — Curb

Package `app.joincurb.curb`. Ordered by dependency. The 12-testers-for-14-days
rule is the long pole: start closed testing the day you have any build, because
nothing runs it down faster and everything else fits inside it.

---

## 1 · Create the app

Play Console → **Create app**.

| Field | Value |
|---|---|
| App name | Curb — Quit Any Addiction |
| Default language | English (US) |
| App or game | App |
| Free or paid | **Free** (subscriptions are separate, as on Apple) |

Declarations: it is not a game, it does contain ads → **No**.

## 2 · The build

`app.json` already sets the Android package, adaptive icons and permissions
(`POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`).

```bash
eas build --profile production --platform android
```
EAS generates and keeps the upload keystore. Play App Signing then holds the
release key — **the keystore EAS holds is the only way to ship an update**, so
do not lose access to that Expo account.

`eas.json`'s production profile already carries the env the build needs; add
`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` once step 5 gives you one.

## 3 · Subscriptions — Play's shape differs from Apple's

Play splits what Apple calls a product into a **subscription** plus a **base
plan**. Create three subscriptions, each with one base plan:

| Subscription ID | Base plan ID | Billing period | Price |
|---|---|---|---|
| `curb.premium.weekly` | `weekly` | 1 week | $9.99 |
| `curb.premium.monthly` | `monthly` | 1 month | $14.99 |
| `curb.premium.yearly` | `yearly` | 1 year | $59.99 |

Set **auto-renewing**, no free trial, no introductory offer — matching Apple and
the paywall copy.

⚠️ RevenueCat identifies these as **`subscriptionId:basePlanId`**, not the bare
id. That is why the app matches packages by `packageId` (`$rc_weekly` etc.)
rather than product id — see `plans.ts`. Keep it that way.

## 4 · Play Developer API access

RevenueCat needs to read purchase state.

1. Play Console → **Setup → API access** → link a Google Cloud project.
2. Create a **service account** in that project, grant it the Play Console
   permissions RevenueCat asks for (view financial data, manage orders).
3. Download the service account **JSON key** and upload it to RevenueCat.

Propagation is slow — Google warns access can take up to 36 hours to become
usable. Do this early; it is the second-longest wait after closed testing.

## 5 · RevenueCat (Android)

- Apps → **+ New → Play Store**, package `app.joincurb.curb`, upload the
  service account JSON.
- Add the three products as **`curb.premium.weekly:weekly`** and so on.
- Attach all three to the existing **`premium`** entitlement.
- Add them to the **`default`** offering's existing packages, so each package
  holds an App Store product *and* a Play product.
- Copy the Android public SDK key (`goog_…`) into `eas.json` (all profiles) and
  `app/.env` as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.

## 6 · Real-time developer notifications

Play's equivalent of App Store Server Notifications.

RevenueCat gives you a Pub/Sub topic name; paste it into Play Console →
**Monetization setup → Real-time developer notifications**. Without it,
cancellations and refunds reach you late, exactly as on Apple.

## 7 · App content — every declaration

Play blocks release until all of these are done:

- **Privacy policy**: `https://joincurb.app/privacy`
- **App access** — ⚠️ see the note below; this needs a decision
- **Ads**: no
- **Content rating** questionnaire — answer as on Apple: references to alcohol
  and tobacco, no sexual content, no violence
- **Target audience**: 18+ (or 13+); **not** designed for children
- **Data safety** — must match the Apple privacy labels exactly: email, name,
  user id, device id, purchases, usage data, health. Collected, linked to the
  user, encrypted in transit, deletable in-app, not sold or shared
- **Health apps declaration** — Curb is habit/recovery support, not medical
- **Government apps**: no · **Financial features**: none

## 8 · Store listing

- Short description — 80 chars: `docs/store/` (Play-specific line in STORE_LISTING.md)
- Full description — 4000 chars: reuse `docs/store/description.txt`
- App icon **512×512** — `brand/play/icon-512.png` (no alpha; Play rejects it)
- **Feature graphic 1024×500** — `brand/play/feature-1024x500.png`. Play only;
  Apple has no equivalent. Generated from the brand mark on the brand tile,
  flat colour, regenerable from `scripts/` if the mark changes.
- Phone screenshots: at least 2, up to 8. The iOS captures work; Play accepts
  16:9 or 9:16 between 320px and 3840px

## 9 · Closed testing — the long pole

Personal Play accounts created after 13 Nov 2023 must run **12 testers opted in
for 14 continuous days** before production access is granted.

- Create a closed testing track, add 12 real Google accounts, get each to opt in
  via the link and actually install
- The 14 days only run while at least 12 remain opted in
- Add the same accounts as **License testers** (Setup → License testing) so they
  can exercise purchases without being charged

## 10 · Production

Apply for production access, then create the production release. Google's review
of a first release from a new account usually takes longer than Apple's — days
rather than hours.

---

## Two things that need a decision, not a checkbox

**App access.** Play asks how a reviewer reaches content behind a login. Curb
has a hard paywall *and* no password auth — sign-in is Apple, Google, or an
emailed code. Unlike Apple, Play reviewers cannot be assumed to self-serve an
email code, and there is no username/password to hand over. Options, in order of
preference:

1. A dedicated Google account you control, with its purchase granted through a
   RevenueCat promotional entitlement — Play reviewers can sign in with Google.
2. A review-only bypass keyed to a value you set server-side. Effective, but it
   is a backdoor in a paywall and has to be removed later.
3. Instructions only, explaining the sandbox purchase path — the weakest option
   and the one most likely to come back as a rejection.

**Data safety must be answered as of the shipped Android build.** PostHog now
ships and is consent-gated in onboarding; declare usage and health data as
collected. A Data safety form that under-declares is the Play equivalent of the
Apple label mismatch, and it is enforced by removal rather than rejection.
