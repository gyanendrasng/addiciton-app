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
- **Website is deployed and live** — `/`, `/privacy`, `/terms`, `/support`,
  `/crisis` and `/api/auth/get-session` all return 200 on joincurb.app.
- **DNS on Cloudflare**, zone active (`hassan`/`lina.ns.cloudflare.com`).
- **Email works both ways.** Inbound: Cloudflare Email Routing, catch-all →
  info@gyanendra.dev, so `support@`, `privacy@` and `hello@` all receive.
  Outbound: Resend DKIM + SPF verified, with its MX correctly on the
  `send.joincurb.app` subdomain rather than the root — so it doesn't collide
  with Email Routing's MX. DMARC published at `p=none`.
- **Legal identity filled** — Gyanendra Singh, Delhi Cantt, governed by Indian
  law, across the privacy policy and terms.
- Crisis lines and a medical disclaimer **inside** the app (`/help`), reachable
  from Settings, the urge outcome and after a slip, and deliberately not behind
  the paywall.
- **App Store Connect record created** — `app.joincurb.curb`, SKU `curb-ios`,
  Apple ID 6808528188.
- **App Information complete** — name, subtitle `Quit tracker for any habit`,
  privacy policy URL, Health & Fitness / Lifestyle, content rights, standard
  EULA, encryption keys already in `app.json` (no documentation upload needed).
- **Age rating 13+** (12+ Vietnam/Korea). Declared Infrequent on substances,
  Infrequent on medical/wellness, Yes on health topics, Infrequent on mature
  themes, None on all sexual content — the answer that keeps it off 18+.
- **Regulated Medical Device: No.** Required because of the Health & Fitness
  category, not the rating; without it the EU pulls distribution post-launch.
- **DSA trader status declared** — required to sell in the EU at all.
- **App Privacy filled**: Name, Email, User ID, Device ID, Purchases. All
  App Functionality, all Linked, **none used for tracking**. Health is
  deliberately **not** declared — the server schema holds only account and
  entitlement rows, and nothing else is transmitted today.
- **Subscription group `Curb Premium`** with all three products created at
  levels 1/2/3, ids matching `plans.ts`. Group localization uses the custom app
  name **`Curb`** rather than the full store name, so iPhone Settings →
  Subscriptions doesn't advertise what the app is for.
- Family Sharing **off** on every plan — a shared subscription is visible to
  the whole family, which is the wrong default for a recovery app.
- **Accessibility label drafted** — Dark Interface and Sufficient Contrast on
  iPhone. Can only be published once a version is live.

---

## 1. Blocking — nothing ships without these

### Carried over from the legal identity — still to confirm
- [ ] The App Store Connect and Play **seller name must be exactly
      "Gyanendra Singh"**, or it won't match the policy.
- [ ] That postal address becomes public — both stores publish the seller
      address for paid apps. Swap it for a registered office if you'd rather not
      publish a home address; it's in `privacy/page.tsx` and `terms/page.tsx`.
- [ ] India, individual seller: check whether GST registration applies to app
      revenue before taking payments.

### Environment variables — the remaining deploy work
- [ ] Set every var from `.env.example` in Vercel, **Production and Preview**.
      The site is live but these can't be verified from outside.
- [ ] `BETTER_AUTH_SECRET` — `openssl rand -base64 32`. Without it Better Auth
      falls back to a default secret and logs an error at build time.
- [ ] `RESEND_API_KEY` — sending-access key, restricted to joincurb.app. The
      DNS side is verified; without the key, production sign-in codes throw.
- [ ] ⚠️ `REVENUECAT_WEBHOOK_SECRET`: if unset, **every webhook 401s** and
      purchases never reach the database. Silent failure. Set it before you
      take a payment.

### Store accounts 
- [ ] Apple Developer Program — $99/yr, 24–48h to activate.
- [ ] Google Play Console — $25 once.
- [ ] **Start Play closed testing immediately** (12 testers × 14 days).

---

## 2. Purchases — the remaining work

`react-native-purchases` 10.9 **is installed** and wired through
`features/premium/purchases.ts` behind a lazy require, so Expo Go still runs.
What's missing is the account plumbing.

- [x] Apple subscription group + 3 products created.
- [x] **In-App Purchase key** uploaded to RevenueCat (key `42F8Q44BDH`, issuer
      `bd79e031-…`), plus an App Store Connect API key so products import and
      prices stay in sync.
- [x] RevenueCat project `a34a8d56` → app `Curb (App Store)` → products
      imported → entitlement **`premium`** with all three attached → `default`
      offering repointed at the App Store products.
- [x] **App Store Server Notifications** production URL set to RevenueCat's
      endpoint.
- [x] **Webhook verified end to end** — RevenueCat test event returns **200**
      from `joincurb.app/api/revenuecat/webhook`. Note this only proves auth and
      reachability: the test event's `app_user_id` matches no row, so the
      entitlement write is still unexercised until a sandbox purchase.
- [x] Vercel has all four `REVENUECAT_*` vars (Production) and has redeployed.
- [ ] Same three ids in **Play Console**.
- [ ] Sandbox Server URL in App Store Connect (same RevenueCat endpoint).
- [x] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in `app/.env` (gitignored).
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` once the Play app exists.
- [ ] Sandbox tester (Users and Access → Sandbox) on an email that has never
      been an Apple ID.
- [ ] Paywall **review screenshot** on each of the 3 products — needs a build,
      and it's the only thing keeping them at Missing Metadata.
- [ ] Click **Add for Review** on the group once the screenshots are attached;
      the first subscription group ships with the 1.0 binary.
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
- [x] Subtitle, category, age rating — done on App Information.
- [ ] Keywords, promotional text and description on the **version** page —
      all in `docs/STORE_LISTING.md`, character counts verified.
- [ ] Support URL `joincurb.app/support`, privacy URL `joincurb.app/privacy`.
- [ ] Terms (EULA) in App Store Connect, or Apple's standard EULA.
- [ ] Age rating. Apple moved to 4+/9+/13+/16+/18+ in July 2025 — answer the
      questionnaire honestly about references to addiction.

---

## 6. Privacy declarations — get these right

- [x] **Apple privacy nutrition labels** — filled and matching the binary.
- [ ] ⚠️ **Re-answer App Privacy before any version that ships PostHog or
      server-side recovery data.** Today Health is declared *not* collected,
      which is true: the server schema holds account and entitlement rows only.
      The moment habits or streaks are transmitted, that label is false, and a
      shipped app collecting more than it declares is the top takedown risk for
      this category. `app/src/lib/analytics.ts` says the same in its header.
- [ ] **Play Data safety form** — same answers, plus: encrypted in transit,
      deletable in-app, and the analytics opt-out in Settings.
- [ ] Confirm the shipped app matches both filings. A mismatch between the
      declaration and the SDK's actual traffic is what gets apps pulled.
- [ ] **Play Health apps declaration** — Curb is habit/recovery support, not
      medical. Answer accordingly.
- [ ] Confirm no surface makes a data-locality claim at all — "no servers",
      "never leaves your device", "what you write stays on your phone". All
      removed deliberately: recovery data is expected to become server-side,
      and a retracted privacy claim is worse than one never made.

---

## 7. Content review risks — worth a pass before submitting

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
