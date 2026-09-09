# Screen Time blocking — plan

Can Curb add Apple's Screen Time API now? **Yes, on iOS, with two gates that
nothing in this repo can shorten:** Apple has to grant the Family Controls
entitlement, and the feature needs a new native build through App Store
review — it cannot ship over the air. Android has no honest equivalent yet;
see §7.

Written 9 Sep 2026 against `react-native-device-activity` 0.6.1, Expo SDK 57,
iOS deployment target 16.4, and the blocking-tech research in
`docs/research/competitors.md` §3.6.

---

## 1. What the research says to build

Blockers on their own habituate — every reviewer calls them "external
policing" and friction effects plateau around 30% after two or three weeks.
The best-rated products pair a blocker with an internal program and a key the
user does not hold. QUITTR's blocker is its weakest-reviewed feature ("no
better than Screen Time") precisely because it is a bare shield with none of
that.

Curb already has the program half: the urge toolkit, reasons, the delay step,
the trigger window from onboarding. The blocker should plug into those, not
sit beside them as a settings page.

## 2. Scope for v1 — "Shield"

One feature, three moments. Nothing else in the first release.

| Moment | What happens | Why |
|---|---|---|
| **Set up** | User picks apps/sites with Apple's picker (opaque tokens, Curb never sees names). Per habit: porn → adult-content web filter on by default; social → the picker; others → picker optional. | The picker is the only Apple-sanctioned UI; category tokens keep the selection small. |
| **Trigger window** | Shields turn on daily from the trigger hour onboarding already derives (`triggerFrom()` in `features/notifications/trigger-window.ts` — 18:00 stressed, 20:00 bored/lonely, 21:00 night) for a default three hours, editable on the Shield screen. | Just-in-time beats fixed schedules (Quit Sense, §Evidence). Zero extra questions asked; the same hour drives the existing nudge. |
| **In the urge flow** | The **Delay** step gets a "Lock it for 15 / 30 / 60 minutes" button. Shield goes up immediately; the shield screen shows one of the user's own reasons and a "Open Curb" action. | Remojo's Panic Mode is the multi-modal urge flow §Gaps asks for. The shield is the one place a reason can reach someone who has already left the app. |

**Unlocking.** Ending a lock early is allowed, but only after a user-set delay
(Plucky's model, 5 min default). No partner-held key yet — that is v2, and
depends on the accountability-partner feature. Point users who want a hard
lock at iOS 26.4's *Settings → Screen Time → Lock Screen Time Settings*, with
the suggestion that someone they trust sets the code. That is a system
feature, no API, and it also blocks uninstall.

**Deliberately out:** DNS/VPN profiles (one VPN at a time, breaks calls, false
"off" alerts), keyword blocking, usage reports/screen-time stats, uninstall
protection claims, anything that reads what the user was looking at.

## 3. Sequence

### Phase 0 — the entitlement (today, before any code)

1. developer.apple.com → Identifiers → `app.joincurb.curb` → request
   **Family Controls (Distribution)**. The request must say it is
   self-management (individual authorization, iOS 16+), not parental control.
2. Create and request the same for the three extension identifiers the module
   generates: `app.joincurb.curb.ActivityMonitorExtension`,
   `app.joincurb.curb.ShieldAction`, `app.joincurb.curb.ShieldConfiguration`.
   Apple approves per bundle id; extensions have been the slow ones.
3. Create the app group `group.app.joincurb.curb`.

Apple quotes 48 hours. In 2026, developer forum threads show requests sitting
for weeks with no reply (March and April cases with no response after four
follow-ups). **This is the long pole; everything else waits on it.**
Development builds work with the free development entitlement, so the spike
can start the same day.

### Phase 1 — spike in a dev build (3–4 days)

- `npx expo install react-native-device-activity`; plugin in `app.json` with
  `appleTeamId: QCQ36X5458` and the app group. `expo prebuild` regenerates
  `ios/` with the three targets.
- Prove on a real device (Screen Time does not work in the Simulator):
  authorize → pick → shield now → shield on a schedule → shield action opens
  Curb. Record what actually fires; the README warns `getAuthorizationStatus`
  can return `notDetermined` after a choice, the native picker "is prone to
  crashes", and DeviceActivity thresholds misfire. Decide from evidence, not
  the README, whether the scheduled shield is reliable enough for the trigger
  window or whether v1 is on-demand locks only.
- Wrap the module exactly like `features/premium/purchases.ts`: lazy
  `require` in a try/catch, every function a no-op in Expo Go and on Android,
  so the rest of the app and the Maestro flows keep running.

### Phase 2 — build (1.5–2 weeks after the spike)

- `features/shield/` — `store.ts` (selection + schedule in SQLite: a
  `shield` settings row holding the serialised selection and the lock state;
  tokens are device-bound and never leave the phone, so nothing here touches
  the server or the entitlement sync), `lock.ts` (start/extend/end with the
  unlock delay), `schedule.ts` (trigger-window → DeviceActivity schedule,
  rescheduled whenever the onboarding answers change — same hook that
  `rescheduleMilestones` uses).
- Shield appearance via the ShieldConfiguration extension: `palette` colours,
  flat, the user's reason as the subtitle, primary button "Open Curb", secondary
  "Not now". Both skills apply here as much as to any screen; the shield is
  the most-seen screen the feature has.
- `/shield` route (setup, pick, edit, unlock delay) reached from Settings and
  from the first urge survived; the Delay step button; a "Shield on until
  22:00" line on Home while a lock is active.
- Copy rules from `AGENTS.md` still hold: describe what it does, no "never
  leaves your device" even though for this feature it happens to be true.
- Add `shield_set_up`, `shield_lock_started`, `shield_opened_curb` to the
  closed event list in `lib/analytics.ts`. Never the selection.

### Phase 3 — ship (2–3 weeks, mostly waiting)

- New production build (`npm run build:prod`), version bump; `runtimeVersion`
  policy is `appVersion` so OTA correctly refuses old builds.
- App Store review notes: what the entitlement is for, how to test (the
  review account already exists), that no Screen Time data is transmitted.
- `website/src/app/privacy/page.tsx`: one paragraph naming the Screen Time
  permission and that Curb receives opaque selection tokens, not app names or
  usage. App Privacy labels are unchanged — nothing new is collected.
- Play: nothing, this build is iOS-only for the feature; Android keeps the
  no-op.
- Docs: `SUBMISSION.md` gets a Shield line; `OTA.md`'s table already says a
  native module is a new build.

### Phase 4 — decide Android (after v1 ships)

See §7.

## 4. Technical notes worth knowing before the spike

- Module: `react-native-device-activity` 0.6.1 (Feb 2026), peers
  `expo >=52`, `react-native >=0.76` — SDK 57 / RN 0.86 satisfy the ranges but
  are newer than what the README has been tested on; budget a day for that.
- iOS 15.1 minimum in the module; ours is 16.4, fine. Individual (self)
  authorization needs 16+, which is why the target is not a problem.
- Apple limits: 50 tokens per shield category, 20 monitored activities,
  15-minute minimum interval, 6 MB memory in extensions. The trigger window
  is one activity; on-demand locks are a second. Well inside.
- Web shields cover Safari only. The adult-content filter is
  `setWebContentFilterPolicy`; it does not touch third-party browsers, and
  the setup copy should say "in Safari" rather than imply more.
- Authorization revoked in Settings is not reflected until the app restarts;
  re-read on foreground and treat `notDetermined` as "check again", not as
  "off".
- Screen Time does not run in the Simulator: the Maestro flows must skip the
  feature (the no-op wrapper does that) and verification is on a device.
- Expo Go keeps working because of the lazy require; the theme-switch reload
  and everything else are untouched.

## 5. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Entitlement takes weeks or is refused | real, per 2026 forum reports | Request today; build v1 so it degrades to "not available yet" if the build ships first; keep the feature out of store copy until approved. |
| Scheduled shields unreliable | known | Spike decides; on-demand locks alone are still a shippable v1. |
| Picker crashes / token bloat | known | Encourage categories over individual apps; cap the selection; catch and surface through `humanError`. |
| Users blame Curb for iOS revoking the permission | likely | Detect and show a one-tap "Turn Shield back on" card rather than silently doing nothing — QUITTR's top blocker complaint. |
| Review pushback on Family Controls | possible | Self-management wording, review notes, no parental-control framing anywhere. |
| Scope creep into "a blocker app" | certain if allowed | §2 is the whole v1. Usage stats, keyword lists, VPN: no. |

## 6. Effort

Roughly 3–4 weeks of calendar time, of which ~2 are code and the rest is
Apple. Sequence the entitlement request first and the code fits inside the
wait. If the entitlement lands early, Phase 3 can start the moment Phase 2's
build passes on a device.

## 7. Android

Nothing comparable exists. `AccessibilityService` is what BlockerX, Remojo and
QUITTR use, and it is the wrong bet now: Play requires prominent disclosure
and a declaration, and **Android 17 auto-revokes accessibility for any app that
is not an accessibility tool**. `UsageStats`-based limits can show an overlay
after N minutes but cannot shield; `VpnService` DNS filtering is a second
product. The honest Android story for v1 is "Shield is on iPhone today" and
the urge toolkit, which is identical on both.

Revisit once the iOS feature has data on whether people use it. If they do,
the Android v1 candidate is a `UsageStats` + overlay implementation for app
limits only, with no web filtering.
