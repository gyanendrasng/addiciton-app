# Over-the-air updates (EAS Update)

Ship JS + assets to installed apps in seconds, with no App Store review.

## Is it allowed?

Yes. Apple guideline **2.5.2** bars downloading *executable* code, but the
**Developer Program License Agreement §3.3.2** explicitly permits *interpreted*
code (JavaScript), provided the update:

1. does not change the app's primary purpose beyond what was reviewed,
2. does not create a store/storefront for other code, and
3. does not bypass signing, the sandbox, or in-app purchase.

Google Play has an equivalent allowance. This is how Instagram, Discord,
Shopify and Walmart ship React Native changes.

**The line you must not cross:** submitting a tame build for review and then
OTA-ing in the real functionality. The rule is about intent, not mechanism.

## What can and cannot ship over the air

| Change | OTA? |
|---|---|
| Screens, copy, colors, streak math, games, new JS-only features | ✅ |
| Bug / crash hotfixes | ✅ |
| Adding a native module (blocker, widgets, RevenueCat) | ❌ new build + review |
| New permissions or `app.json` plugin changes | ❌ new build |
| Anything that changes the app's advertised purpose | 🚫 not allowed |

## Status in this repo

Scaffolded but **not active**. `expo-updates` is deliberately *not* installed:
its native module initializes a database that crashes the **Expo Go** runtime
(`UNIQUE constraint failed: updates.scope_key`). Everything else is ready.

Already in place:
- `eas.json` — `development` / `preview` / `production` profiles, each bound to
  an update channel.
- `src/lib/ota.ts` — the update module, currently a no-op stub with the real
  implementation in a commented `ACTIVATE` block.
- `package.json` scripts — `ota:preview`, `ota:production`, `build:dev`, `build:prod`.
- `src/theme/theme.ts` — calls `reloadApp()`, so instant theme switching turns
  on by itself once OTA is live.

## Activation (do this with the development build, not in Expo Go)

```bash
npm i -g eas-cli
eas login
eas init                      # links the project to your Expo account

npx expo install expo-updates
eas update:configure          # writes the updates URL + runtimeVersion into app.json

# then: uncomment the ACTIVATE block in src/lib/ota.ts and delete the stub above it

npm run build:dev             # first build that can receive updates
```

## Publishing updates

```bash
npm run ota:preview    "fix urge timer"      # internal testers
npm run ota:production "new light theme"     # everyone on the production channel
```

## How it behaves at runtime

- The app checks for an update **on launch**, downloads it in the background,
  and applies it on the **next** launch — so a session is never interrupted.
- Call `reloadApp()` to apply immediately (the theme switch does this).

## runtimeVersion — the safety catch

An update is only delivered to builds whose `runtimeVersion` matches. When you
change native code, bump it: old builds then correctly refuse the incompatible
JS bundle instead of crashing. `eas update:configure` sets a policy (we use
`appVersion`) so this is handled for you.

## Cost

EAS Update has a free tier, then pricing by monthly active users.
