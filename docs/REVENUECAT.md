# RevenueCat setup

Order matters: Apple first, then RevenueCat, then the env vars, then verify.
Everything here was worked out against the real dashboards, not from memory.

## Prerequisites (App Store Connect)

- Paid Applications Agreement **Active** — agreement + bank account + tax forms.
  Products can exist before this, but sandbox purchases fail and nothing can be
  submitted.
- Subscription group `Curb Premium` with the three products created.
- **In-App Purchase Key** (Users and Access → Integrations → In-App Purchase).
  The `.p8` downloads **once**. Note the **Key ID** and the **Issuer ID** shown
  on that page — neither is recoverable from the file.
- **Sandbox tester** (Users and Access → Sandbox) on an email that has never
  been an Apple ID.
- App-Specific Shared Secret is **optional** — StoreKit 1 receipt validation
  only. The In-App Purchase Key covers StoreKit 2, which is what ships.

## Purchase before account

The wall comes before sign-in, so the first purchase is made under RevenueCat's
**anonymous** App User ID. How it reaches the account
(`app/src/features/premium/claim.ts`):

1. Store confirms → local premium mirror goes true, the anonymous id is saved
   as a *pending claim*. The app opens; the gate then asks for an account.
2. Sign-in → `Purchases.logIn(userId)` merges the anonymous customer into the
   account (RevenueCat: "CustomerInfo merged"). No webhook announces a merge.
3. The app calls **`POST /api/entitlement/sync`** with the anonymous id; the
   server re-reads `active_entitlements` for the user (then the anonymous id as
   a fallback) and writes the `entitlement` row with `revenuecatId` set to
   wherever it was found, so later webhooks resolve to the user.
4. While a claim is pending, a "not premium" from the server is ignored; only
   the store's own `getCustomerInfo()` saying no revokes.

Restore still works with no account (Apple ID / Play account). An existing
subscriber on a new phone uses **Sign in** on the paywall; the server
entitlement then opens the app.

Deploy the website before shipping the app change: without the sync route the
claim stays pending (the app still opens; the server learns at the next
renewal webhook via `aliases`).

## RevenueCat

1. **App** — Apps → + New → App Store. Bundle id `app.joincurb.curb`, upload the
   `.p8` with its Key ID and Issuer ID.
2. **Products** — Product catalog → Products. Exactly these, matching
   `app/src/features/premium/plans.ts`:
   `curb.premium.yearly` · `curb.premium.monthly` · `curb.premium.weekly`
3. **Entitlement** — identifier **`premium`**, all three products attached.
   Must match `ENTITLEMENT_ID` in `app/src/features/premium/purchases.ts`, or a
   purchase completes and the app never unlocks.
4. **Offering** — identifier `default`, marked **Current**, three packages
   (Annual / Monthly / Weekly). `fetchPrices()` reads `offerings.current`; if
   this isn't current, the paywall silently shows the hardcoded USD fallbacks.
5. **API keys** — the Apple *public* key (`appl_…`) ships in the app; a **v2
   secret** key (`sk_…`) with `customer_information:customers:read` stays on the
   server. v1 keys do not work against the v2 REST API.
6. **Webhook** — Integrations → Webhooks:
   - URL `https://joincurb.app/api/revenuecat/webhook`
   - Authorization header value = `REVENUECAT_WEBHOOK_SECRET` **verbatim**. The
     route compares the whole header with `timingSafeEqual`; it does not strip a
     `Bearer ` prefix, so the two strings must be byte-identical.
   - Environment **Both Production and Sandbox**, **All events** — the handler
     deliberately doesn't branch on event type, it re-reads canonical state, so
     filtering starves it.
7. **App Store Server Notifications** — paste RevenueCat's URL into App Store
   Connect → App Information → Production (and Sandbox) Server URL, so
   cancellations arrive in seconds rather than on next app open.

## Environment

`app/.env` — publishable, ships in the binary by design:
```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
```

Vercel, **Production and Preview**, then redeploy (env changes don't apply to
existing deployments):
```
REVENUECAT_WEBHOOK_SECRET=...
REVENUECAT_API_KEY=sk_...
REVENUECAT_PROJECT_ID=...
REVENUECAT_ENTITLEMENT_ID=premium
```

⚠️ `REVENUECAT_WEBHOOK_SECRET` unset means `authorized()` returns false for
every request: purchases succeed, money moves, and no `entitlement` row is ever
written. It fails silently — there is no error anywhere in the app.

## Verify

Needs a dev build; neither RevenueCat nor Apple sign-in runs in Expo Go.

1. Sandbox purchase completes in the app.
2. RevenueCat → Customers shows the user entitled to `premium`.
3. Neon: `select * from entitlement` has the row, `active = true`.
4. Sign in on a second device — premium is there without repurchasing.
5. Cancel in sandbox and confirm `EXPIRATION` revokes it.
