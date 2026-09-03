# Publishing Curb — what's left

Audited against the repo, not written from a template. Anything marked ✅ was
verified in the code or the console; everything else is genuinely outstanding.

The single longest pole is **Google Play's 12 testers × 14 days of closed
testing**. Start it the day you have any installable build, because it runs in
parallel with everything else here and nothing can shorten it.

---

## Already done ✅

- App identity is final and consistent: name **Curb**, slug `curb`, scheme
  `curb`, bundle id / package **`app.joincurb.curb`**, version 1.0.0.
- Icons, adaptive icons, splash, favicons, and 3 IAP promo images (`brand/`).
- Neon Postgres created and **migrated** — `user`, `session`, `account`,
  `verification`, `entitlement`, `revenuecat_event`, all FKs cascading.
- Google Cloud OAuth **web client** created, both redirect URIs registered.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL` in `website/.env`.
- Website builds clean; privacy, terms, support, crisis and delete-data pages
  exist. In-app links to Terms and Privacy (Apple 3.1.2) and a
  "Manage or cancel" route (Play policy) are in Settings.
- Account deletion in-app (Apple 5.1.1(v)), cascading to every table.

---

## 1. Blocking — nothing ships without these

### Legal identity
- [ ] Decide the selling entity (sole trader vs. company). This is who the
      contract is with and who Apple pays.
- [ ] Replace **`[LEGAL ENTITY NAME]`**, **`[REGISTERED ADDRESS]`** and
      **`[JURISDICTION]`** — 8 occurrences across `website/src/app/terms/page.tsx`
      and `privacy/page.tsx`. Apple rejects placeholder legal text.

### Email
- [ ] Create `support@`, `privacy@` and `hello@joincurb.app`. A catch-all
      forward covers all three. **`hello@` must be on a domain verified in
      Resend** or sign-in codes never send.

### Deploy the website
- [ ] Deploy to Vercel, point `joincurb.app` at it.
- [ ] Set every env var from `.env.example` in **Production and Preview**.
- [ ] `BETTER_AUTH_SECRET` — `openssl rand -base64 32`. Not yet generated.
- [ ] ⚠️ `REVENUECAT_WEBHOOK_SECRET`: if unset, **every webhook 401s** and
      purchases never reach the database. Silent failure. Set it before you
      take a payment.

### Store accounts
- [ ] Apple Developer Program — $99/yr, 24–48h to activate.
- [ ] Google Play Console — $25 once.
- [ ] **Start Play closed testing immediately** (12 testers × 14 days).

---

## 2. Purchases — the app currently cannot take money

`react-native-purchases` is **not installed**; `paywall.tsx` grants premium
locally under `__DEV__` and throws in production. Until this is done the app
is unshippable.

- [ ] Create the subscription group and 3 products in App Store Connect and
      Play Console, ids matching `app/src/features/premium/plans.ts`:
      `curb.premium.weekly` $9.99 · `curb.premium.monthly` $14.99 ·
      `curb.premium.yearly` $59.99.
- [ ] RevenueCat project → entitlement id **`premium`** → attach all 3.
- [ ] `npx expo install react-native-purchases`, wire `buy()` and `restore()`.
- [ ] Point the RevenueCat webhook at `https://joincurb.app/api/revenuecat/webhook`
      with the shared secret in the Authorization header.
- [ ] Set the app's RevenueCat App User ID to the Better Auth user id — this is
      what makes the entitlement follow the account. Ids are UUIDv4 already,
      which is what Play/Apple server notifications need.
- [ ] Optional: `REVENUECAT_API_KEY` + `REVENUECAT_PROJECT_ID` (**v2** key) so
      the webhook reconciles against the REST API instead of trusting the event.
- [ ] Test a sandbox purchase end to end: buy → webhook → `entitlement` row →
      app unlocks on a second device.

---

## 3. Sign-in

- [ ] Publish the Google consent screen (**Audience → Publish app**). While in
      Testing only listed users can sign in and refresh tokens die after 7 days.
- [ ] Verify `joincurb.app` in Google Search Console (needed for the authorized
      domain), and fill the Branding page — home page, privacy, terms.
      **Skip the logo**: uploading one triggers brand verification.
- [ ] Enable **Sign in with Apple** on the App ID in the Apple Developer portal.
      `usesAppleSignIn: true` is already set in `app.json`.
- [ ] Only `APPLE_BUNDLE_ID` is needed server-side — no Apple client secret,
      because we use the native idToken flow.
- [ ] Test Apple sign-in on a **real device**. It needs an Apple ID signed in;
      an unsigned Simulator reports it unavailable.

---

## 4. Builds

- [ ] `eas login` && `eas init`.
- [ ] **Dev build** — `eas build --profile development --platform ios`. Required
      for native Apple sign-in and RevenueCat; neither runs in Expo Go.
- [ ] Production builds for both platforms.
- [ ] OTA: `expo-updates` is **not installed**; `src/lib/ota.ts` is a no-op stub
      with an ACTIVATE block to uncomment. Optional for v1 — see `docs/OTA.md`.

---

## 5. Store listings

- [ ] Screenshots: iPhone 6.9" **and** 6.5" (Apple), plus Android. Take them
      from a real build with real data, not the placeholder state.
- [ ] Play **feature graphic** 1024×500.
- [ ] Description, keywords, subtitle, category (Health & Fitness).
- [ ] Support URL `joincurb.app/support`, privacy URL `joincurb.app/privacy`.
- [ ] Terms (EULA) in App Store Connect, or Apple's standard EULA.
- [ ] Age rating. Apple moved to 4+/9+/13+/16+/18+ in July 2025 — answer the
      questionnaire honestly about references to addiction.

---

## 6. Privacy declarations — get these right

- [ ] **Apple privacy nutrition labels.** You cannot claim "Data Not Collected":
      the account stores an email, and RevenueCat collects a purchase identifier.
      Declare *Contact Info → Email* and *Purchases*, both linked to identity,
      used for App Functionality. Recovery data is genuinely not collected.
- [ ] **Play Data safety form** — same answers. Declare the email and purchase
      data, and that data is encrypted in transit and deletable in-app.
- [ ] **Play Health apps declaration** — Curb is habit/recovery support, not
      medical. Answer accordingly.
- [ ] Confirm nothing claims "nothing leaves your device". The accurate line,
      used throughout, is *"your recovery data never leaves your device"*.

---

## 7. Content review risks — worth a pass before submitting

- [ ] **Medical disclaimer + crisis lines inside the app.** `website/crisis`
      exists but the app links to neither. Alcohol especially: unsupervised
      withdrawal can be dangerous, and reviewers look for this in recovery apps.
      This is the most likely rejection reason left.
- [ ] Re-read onboarding for outcome claims. Already softened once; the score
      and "rewired" framing are the remaining candidates.
- [ ] Confirm the paywall shows price, period, Terms, Privacy and Restore
      (3.1.2) — it does today; keep it that way.

---

## Notifications — current state

All local, no push tokens, no server. Three schedulers remain:

| id | what | when |
|---|---|---|
| `reminder-morning` | morning pledge | daily, user-set hour |
| `reminder-evening` | evening check-in | daily, user-set hour |
| `reminder-trigger` | the user's stated hard hour | daily, derived from onboarding |
| `milestone-<n>` | next milestones | date-triggered |

The **$29.99 come-back notification was removed** along with the discount —
Apple can't target a discount at new users who hesitated (introductory offers
go to every new subscriber; promotional offers reach only existing or lapsed
ones). Nothing else was touched.
