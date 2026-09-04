# App Store submission — Curb

Everything needed to press Submit, in dependency order. `[x]` was verified in
the console or the code, not assumed.

App: **Curb — Quit Any Addiction** · `app.joincurb.curb` · Apple ID `6808528188`

---

## Done

**App Information**
- [x] Name, subtitle `Quit tracker for any habit`, privacy policy URL
- [x] Primary **Health & Fitness**, secondary **Lifestyle** (deliberately not
      Medical — that invites a stricter review track the app can't substantiate)
- [x] Content rights: no third-party content
- [x] Apple's Standard License Agreement
- [x] **Age rating 13+** (12+ Vietnam/Korea)
- [x] **Regulated Medical Device: No** — required by the Health & Fitness
      category, and its absence removes EU distribution *after* launch
- [x] **DSA trader status declared** — without it the app is pulled from every
      EU storefront
- [x] Encryption: `ITSAppUsesNonExemptEncryption: false` already in `app.json`,
      so no documentation upload and no per-build prompt

**App Privacy** — Name, Email, User ID, Device ID, Purchases. All *App
Functionality*, all *Linked*, **none used for tracking**.
- [x] Answers match the shipped binary: the server schema holds account and
      entitlement rows only, so Health and Usage Data are correctly absent

**Monetization**
- [x] Group `Curb Premium`; `curb.premium.yearly` $59.99 · `.monthly` $14.99 ·
      `.weekly` $9.99, all 175 territories, localized, Family Sharing **off**
- [x] Group display name uses the custom app name **`Curb`**, so iPhone
      Settings → Subscriptions doesn't announce "Quit Any Addiction" to anyone
      holding the phone
- [x] App Store Server Notifications → RevenueCat, Production **and** Sandbox
- [x] In-App Purchase key + App Store Connect API key uploaded to RevenueCat
- [x] RevenueCat: products imported, entitlement `premium`, `default` offering
      repointed off the Test Store products it shipped with
- [x] Webhook returns **200** — proves auth and reachability only; the
      entitlement write is still unexercised
- [x] Vercel has all four `REVENUECAT_*` vars and has redeployed
- [x] `app/.env` has the publishable `appl_…` key
- [x] Sandbox tester created

---

## 1 · EAS and the build

- [ ] `eas login && eas init`
- [ ] `eas update:configure` — writes the updates URL and `runtimeVersion` into
      `app.json`. **Until this runs `Updates.isEnabled` is false and OTA is
      inert**, even though `expo-updates` is installed and wired.
- [ ] `eas build --profile development --platform ios` (simulator — screenshots
      and day-to-day dev)
- [ ] `eas device:create`, then `eas build --profile preview --platform ios`
      (device — the only way to test purchases)

## 2 · Verify on a real device

Sandbox purchases do **not** work on the simulator.

- [ ] Sign in with Apple, Google and email code against production `joincurb.app`
- [ ] Buy the weekly plan with the sandbox tester
- [ ] Confirm the `entitlement` row appears in Neon, `active = true`
- [ ] Sign in on a second device — premium follows the account, no repurchase
- [ ] Cancel in sandbox and confirm `EXPIRATION` revokes it
- [ ] Restore Purchases works after a delete/reinstall (Apple 3.1.1)

## 3 · Blocking outside App Store Connect

- [ ] **Publish the Google OAuth consent screen.** While it's in Testing only
      listed accounts can sign in — a reviewer tapping "Continue with Google"
      hits an error, which is a 2.1 rejection. Verify `joincurb.app` in Search
      Console for the authorized domain. Skip the logo: it triggers brand
      verification and a multi-week wait.
- [ ] Enable **Sign in with Apple** on the App ID in the developer portal
      (`usesAppleSignIn: true` is already in `app.json`)

## 4 · Assets

- [x] App icon — `brand/icon.png`, wired in `app.json`; the 1024 store icon
      comes from the build
- [x] IAP promo images exist (`brand/iap/*.png`, 1024², one per plan) — optional
      unless you enable App Store Promotion
- [ ] **Screenshots: 6.9" and 6.5"**, from real data, not the empty state
- [ ] **Paywall review screenshot** attached to each of the three subscriptions
      — this is the only thing keeping them at Missing Metadata

## 5 · The version page (1.0 Prepare for Submission)

All copy is in `docs/STORE_LISTING.md`, character counts verified.

- [ ] Promotional text (170)
- [ ] Description (4000)
- [ ] Keywords (99/100) — tuned so nothing repeats the name or subtitle
- [ ] Support URL `joincurb.app/support`, marketing URL `joincurb.app`
- [ ] Copyright: `2026 Gyanendra Singh`
- [ ] Build — upload via EAS, wait for processing, then select it
- [ ] App Review Information: contact details, and the notes from
      `STORE_LISTING.md` explaining the hard paywall and where crisis lines live
- [ ] **Add for Review** on the subscription group — the first group ships with
      the 1.0 binary
- [ ] Pricing and Availability: app free, revenue via subscription

## 6 · Worth doing before you submit

- [ ] Add **Sufficient Contrast** to the accessibility draft — it's true now
      that `textFaint` was fixed; it wasn't before
- [ ] Screenshot pass against `.claude/skills/ui-ux/checklist.md` on the real
      build, not from reading code
- [ ] Confirm the seller name reads exactly **Gyanendra Singh**
- [ ] India, individual seller: check whether GST registration applies

## Known gaps — deliberate, not forgotten

- **PostHog is not installed.** The privacy policy already describes it
  (§3c), so policy currently promises more than the binary does. When it ships,
  **App Privacy must be re-answered first** — Usage Data, and Health, because
  habits and streak lengths are health data. A shipped app that collects more
  than its label declares is the top takedown risk in this category.
- **Accessibility**: no reduced-motion support anywhere despite 24 animated
  files; VoiceOver labels missing in ~15 files; Larger Text untested at 200%.
  Only Dark Interface and Sufficient Contrast are claimable today.
