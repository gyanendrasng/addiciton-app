# Store submission checklist

Audited against this repo. Nothing here is generic — it reflects what the app
actually does: **100% on-device, no network calls, no analytics SDKs, no
camera/location/contacts, no accounts.** That posture makes both reviews easier.

---

## 0. Accounts and tooling (do first)

- [ ] **Apple Developer Program** — $99/year, ~24–48h to activate. Enroll as the
      entity that should own the app (personal vs. company matters later).
- [ ] **Google Play Console** — $25 one-time. New personal accounts must run
      **12 testers × 14 days of closed testing** before production access. Start
      this early; it is the long pole on Android.
- [ ] **Expo account** + `npm i -g eas-cli` → `eas login` → `eas init`.

---

## 1. App identity (before the first build — these are permanent)

- [ ] **Final name.** `app.json` currently says `addiction` (placeholder).
- [ ] **Bundle ID / package** — e.g. `com.yourco.forge`. Cannot be changed after
      release; a new one means a new listing.
- [ ] **`scheme`** — currently `addiction`; match the new name.
- [ ] Register the bundle ID in App Store Connect and create the Play listing.

## 2. Assets

- [ ] **Icon** 1024×1024, no alpha, no rounded corners (`assets/images/icon.png`
      exists — replace the Expo default).
- [ ] **Adaptive icon** for Android (foreground/background/monochrome exist —
      replace; `backgroundColor` is still Expo blue `#E6F4FE`, should be black).
- [ ] **Splash** (`splash-icon.png`, black background — already correct).
- [ ] **Screenshots**: iPhone 6.9" **and** 6.5" (required sizes), Android phone
      (min 2, up to 8). Take from the simulator: Home, Urge toolkit, Progress,
      Games, Milestone.
- [ ] **Feature graphic** 1024×500 (Google Play only, required).

## 3. Store listing copy

- [ ] **Subtitle** (iOS, 30 chars) — this is where "quit any addiction" goes.
- [ ] **Keywords** (iOS, 100 chars, comma-separated, no spaces) e.g.
      `quit,addiction,porn,alcohol,smoking,vaping,streak,sobriety,urge,relapse,habit`
- [ ] **Description** (both stores) — lead with the daily loop and urge toolkit.
- [ ] **Promotional text** (iOS, 170 chars, changeable without review).
- [ ] **Support URL** (required) and **Marketing URL** (optional).
- [ ] **Privacy Policy URL** — **required by both stores**, must be a live page.

## 4. Privacy declarations

**iOS — App Privacy questionnaire (App Store Connect)**
- [ ] Answer **"Data Not Collected"** — accurate: nothing leaves the device, no
      analytics, no accounts, no network calls.
- [ ] **Privacy manifest** (`PrivacyInfo.xcprivacy`): Expo generates it. We use
      required-reason APIs via `expo-file-system` (export) — reason `C617.1`
      (files created by the app) — and `UserDefaults` — reason `CA92.1`.
- [ ] Tracking: **No** (no ATT prompt needed, no IDFA).

**Android — Data safety form (Play Console)**
- [ ] Declare **no data collected, no data shared**.
- [ ] Confirm data is encrypted at rest (device-level) and users can request
      deletion — we have **Settings → Delete everything**.

## 5. Age rating and category

- [ ] **Category**: Health & Fitness (primary). Secondary: Lifestyle.
- [ ] **iOS age rating**: honest answers put this at **17+** — the quiz and
      habit list reference pornography and alcohol. Do not attempt to rate lower.
- [ ] **Android content rating** questionnaire → expect Mature 17+.
- [ ] The app must **not** display sexual content itself (it doesn't).

## 6. Legal / compliance pages (must exist before submitting)

- [ ] **Privacy policy** — say plainly: data stored only on the device, never
      transmitted, deletable in Settings, no third-party sharing.
- [ ] **Terms of use** — required by Apple when there's a subscription.
- [ ] **Medical disclaimer** — "not medical advice, not a substitute for
      professional treatment." Both stores scrutinize health claims.
- [ ] **Crisis resources** — a visible link to a helpline (e.g. 988 in the US)
      is expected for addiction/mental-health apps and reviewers look for it.
- [ ] Remove or soften unsupported efficacy claims. Current onboarding copy says
      dopamine receptors recover in ~2 weeks and frames a 90-day program —
      phrase as general education, never as a guaranteed outcome.

## 7. Monetization (before submitting a paid app)

- [ ] Create subscription products in **App Store Connect** and **Play Console**
      (same IDs on both), with intro/trial offers.
- [ ] Integrate **RevenueCat** (or StoreKit/Play Billing directly) — the paywall
      is currently a placeholder that grants access with no purchase.
- [ ] Apple requires, on the paywall screen: **title, length, price**, plus
      links to **Terms** and **Privacy Policy**, and a **Restore Purchases**
      button. Missing any of these is the most common rejection for subscription
      apps.
- [ ] Play requires equivalent disclosure of price and renewal terms.
- [ ] The hard paywall (no free tier) is allowed, but reviewers must be able to
      get past it — see review notes below.

## 8. Build and submit

```bash
# one-time
npx expo install expo-updates && eas update:configure   # enables OTA
# (then uncomment the ACTIVATE block in src/lib/ota.ts)

npm run build:dev                 # development build — replaces Expo Go
npm run build:prod                # production build (iOS + Android)
eas submit --platform ios         # → TestFlight → App Store review
eas submit --platform android     # → internal testing → closed → production
```

- [ ] **TestFlight** the build yourself on a real device before submitting.
- [ ] **iOS review notes** — include a **demo account or a way past the
      paywall** (e.g. a promo code or a reviewer flag). A hard paywall with no
      way through is an automatic rejection.
- [ ] **Export compliance**: no custom crypto → answer "No" (or `ITSAppUsesNonExemptEncryption: false`).
- [ ] Android: complete the **closed testing requirement** (12 testers / 14 days)
      before requesting production access.

## 9. Pre-submission smoke test (on a real device)

- [ ] Fresh install → onboarding → paywall → app loads.
- [ ] Pledge, check-in, urge flow (all 5 games), relapse + undo.
- [ ] Notifications fire at the scheduled times.
- [ ] Kill and relaunch: streak, pledge, check-in all persist.
- [ ] Theme switch, then relaunch.
- [ ] Delete everything → returns to onboarding.
- [ ] Airplane mode: everything still works (it's all local).

## 10. Known rejection risks for this app

| Risk | Mitigation |
|---|---|
| Hard paywall blocks the reviewer | Provide reviewer access in the notes |
| Health/efficacy claims | Soften copy; add medical disclaimer |
| Adult-content adjacency | Rate 17+; app shows no explicit content |
| Missing subscription disclosure | Price/terms/restore on the paywall |
| Data-safety mismatch | Declare "no data collected" — and it's true |
| No crisis resources | Add a helpline link in Settings |

---

## Timeline

| | |
|---|---|
| Apple review | ~24–48h typical, first submission can be slower |
| Google review | a few hours to ~7 days |
| **Google closed testing** | **14 days minimum — start it first** |
| OTA updates afterwards | seconds, no review (see `docs/OTA.md`) |
