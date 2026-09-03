# Addiction-Recovery / Habit-Quitting Apps — Competitive Feature Research

_Researched 2026-08-31. ~35 apps across porn/NoFap, alcohol, smoking/vaping, phone/social media, and general habit trackers. QUITTR is covered separately in `quittr.md`. Prices are US App Store unless stated; many apps A/B-test SKUs so ranges appear. Reddit was not crawlable; Reddit sentiment is second-hand._

## Part 1 — App profiles

### 1A. Porn / NoFap

**Brainbuddy** (AppStudio Australia) — https://apps.apple.com/us/app/brainbuddy-quit-porn-now/id726780077
- *Positioning:* "The secret is science, not willpower" — 100-day dopamine-detox/"rewiring" program; older (35+) user base.
- *Core loop:* onboarding self-test → daily exercise/meditation from the 100-day program → journal → Life Tree grows; Craving Control tool for urges; anonymous team feed.
- *Features:* streak + "rewiring" progress; Life Tree; Craving Control + "SOS list" + ally panic notify; anonymous teams/challenges; daily journal; meditation w/ Apple Health; content blocker with ML filter + custom domains/keywords, passcode lock 1 day–1 year (unreliable per reviewers); paid add-on courses ($7.99). No widgets, no AI coach, no money counter.
- *Pricing:* free download; ~$12.99/mo, 7-day trial; IAP $2.99–$99.99.
- *Reviews:* 4.7★/26K. Praise: community, confidence. Complaints: "$12 a month is WAY too much", unexplained streak resets, groups dissolved, "needs a treatment plan not just a prevention plan" — weak relapse-recovery content. https://www.obex.so/blog/brainbuddy-app-review
- *QUITTR overlap:* QUITTR's blog says it "merges the best elements" of Brainbuddy (Life Tree, exercises) and Fortify. https://quittrapp.com/blog/brainbuddy-vs-fortify

**Fortify** (Impact Collective / Fight the New Drug origin) — https://apps.apple.com/us/app/fortify-find-freedom/id1304648824
- *Positioning:* "Fitbit for your recovery" — learn/connect/track; teen/student and faith-adjacent audience; iOS/Android/web.
- *Core loop:* daily check-in (mood, 11 risk factors, victory/setback) → video lesson from 15 Learning Paths → journal → forum post; Allies see timeline.
- *Features:* streak + risk analytics + trigger patterns; badges/points; forums (5 subgroups); journal w/ calendar; guided meditations; **Allies** (unlimited accountability partners, granular sharing); AI Coaching 24/7 + paid specialist consults. No blocker, no widgets (top request), weak urge tool.
- *Relapse framing:* "setback" logging; "no shaming, just calm but direct encouragement".
- *Pricing:* Basic free (no card); Premium $12/mo, $89.99–$120/yr, $199.99 Forever; Teens/Students $6.95/mo, 13–17 free via scholarship.
- *Reviews:* 4.7★/3.2K iOS, 4.2★ Android. Complaints: check-in data loss, login failures, stale discussions, paywalled content, weak streak visuals.
- *Evidence claims:* self-reported 88% reduction in porn use — no controlled study.

**REMOJO** (UK) — https://www.remojo.com/
- Blocker + coaching suite incl. porn-induced ED. **Urge Manager** (mood + temptation-source → tailored content); **Panic Mode** cuts internet 10–120 min and can ping partner; **bets/penalties with friends** (commitment contract); Skool community; 4 free courses, 11+ paid; **Oversight Protection** (on-screen detection) and **Uninstall Protection** (PIN + partner alert, Android only).
- Tech: Android Accessibility API keyword blocking; iOS VPN-based. iOS app appears delisted (Aug 2026).
- Pricing: historically $4.99/mo, $44.99/yr, 3-day trial; now free app + REMOJO+ coaching ($25–40/mo).
- Reviews: praise filtering/tamper resistance; complaints: crashes, VPN disrupting calls/texts, slow support. https://pornaddictiontest.com/remojo-review/

**BlockerX** (Atmana) — https://apps.apple.com/us/app/blockerx-adult-content-blocker/id1522854086
- Blocker-first. Panic Switch (kills internet), accountability partner gets daily browsing reports + uninstall/VPN-off alerts, access code to disable; 100K-member forum (premium); courses ("Recovery Road Map" $19.99); "AI buddy" (broken per reviewers); habit tracker.
- Tech: Android = AccessibilityService + overlay + optional VpnService + device-admin uninstall protection; iOS = local VPN tunnel with "VPN disabled" notifications only; Chrome extension.
- Pricing: free basic; IAP $49.99/mo, $139.99/yr, $149.99 lifetime; web $109.96/yr, $199.97 lifetime.
- Reviews: 4.4★/8.3K. Complaints: false "VPN disconnected" alerts damaging partner trust, manual domain entry, charged without access.

**Covenant Eyes / Victory** — https://www.covenanteyes.com/pricing/
- Christian-leaning **accountability**, not primarily a blocker; 25 years. Victory Shield takes blurred screenshots; AI rates them; ally gets feed/weekly report + conversation guides; daily commitments/check-ins and mini-courses.
- Tech: iOS = Safari extension screenshots + device-wide VPN for explicit-domain detection; Android = AccessibilityService; desktop = screen recording. Screenshots blurred, AES-256, deleted after 30 days.
- Pricing: $18/mo, $198/yr, $950 lifetime, up to 10 family users; no free tier.
- Reviews: 4.3★/59K. Complaints: VPN blocks cellular unless browser open, constant sign-in, screenshots less frequent than advertised, depends on an engaged ally. No panic button — "post-event reporting rather than real-time urge coaching". https://www.obex.so/blog/covenant-eyes-review

**Rewire Companion** (ex-NF Companion, Android) — Free tracker: second-precise streak, relapse log with notes + trends, badges, "emergency motivation button" (quotes), Discourse forum, "companion" streak pairing, widget, PIN lock, motivational notifications. 500K+ downloads; complaints: sync bugs, "limited depth".

**NoFap official** — No modern first-party app. Tool is the **Emergency/Panic Button** web app + browser extensions: pick the scenario, get curated motivational posts/videos, NSFWGuard redirects. Free. https://nofap.com/updates/panic-button-browser-plugins/

**Other "Quit Porn" apps**
- **Relay**: "rehab in your pocket" — therapist-designed small groups (gender/age matched), daily pulse check, urge log, "red flag" alert to team, 16-week video course, live Zoom meetings (extra), Three Circles, streak widgets. ~$150/yr; $11.99/mo; 4.9★/3K. Complaint: early 5-star prompt, forced sequential unlocking. https://edlatimore.com/relay-porn-addiction-app-review
- **Reboot**: "systems and incentives, not willpower"; counts **total clean days rather than streak** (praised as less counterproductive); Reboot Buddies; paywall after questionnaire draws "should have told me upfront" complaints. $15.99/mo. 4.8★/887.
- **Quitter** ($4.99/mo, $19.99 first year) and **QUITPRN** ($4.99/mo, $14.99/yr, $24.99 lifetime): indie clones of the Life Tree + AI + Safari blocker + meditation bundle.
- **Seed** (gamified plant, $4.99/wk), **NoBeep** ($0.99/mo), **Transform** ($12.99/yr), **Celibacy Tracker** (free, "commit ceremony" onboarding).
- **Blockers:** **Canopy** (on-device computer-vision blur via local VPN, $8.33–12.50/mo); **Plucky** (whitelist-by-default; **settings changes take effect after a user-set delay** — "make choices in moments of strength"; no iOS); **BlockSite** (schedules, Focus Mode, uninstall prevention).

### 1B. Alcohol

**Reframe** — https://apps.apple.com/us/app/reframe-drink-less-thrive/id1485756576
- Neuroscience/CBT **education program** for cut-back or quit; not for AUD/withdrawal.
- Core loop: daily lesson from a 160-day program (reading + journaling prompt) → daily tasks → log drinks vs weekly target → mood/stress rating → optional daily Zoom meeting. Recoins currency.
- Features: sober-days + drink tracker; spend/calorie/BAC calculators; **SOS button** → urge-surfing audio, breathing, journaling, distraction games (Tetris, 2048), mocktail recipes; forum + unmoderated DMs; "Melody" AI chatbot ($9.99–19.99/mo add-on); coach-led Zoom groups; 1:1 coaching $79.99/session.
- Relapse framing: per-day scheduling generates "you failed" even if under weekly goal.
- Pricing: no free tier, 7-day trial; ~$79.99–119.99/yr, $13.99–24.99/mo. https://www.choosingtherapy.com/reframe-app-review/
- Reviews: 4.7★/44K; Trustpilot 3.8. Praise: content depth, meetings, craving games. Complaints: billing/cancellation, hidden costs, confusing navigation.

**I Am Sober** (Hungry Wasp) — https://apps.apple.com/us/app/i-am-sober/id672904239
- #1 abstinence day counter, any addiction. 4.9★/186K iOS, 10M+ Play installs.
- **Pledge model:** morning **Pledge** ("I pledge to stay sober today", with the user's own "why") → evening **Review** (mood, activities, urge difficulty, notes); 127M+ pledges made.
- **Relapse handling:** failing a pledge does **not** auto-reset; user manually resets start date; all prior start dates, milestones, savings, photos retained; accidental reset undoable; calendar shows time between relapses; "don't guilt or shame yourself". Long-sober users can display as "Day 1" to talk to newcomers. https://iamsober.com/en/site/faq
- Features: second-precise counter; milestone celebration screen; money/time/calories saved + withdrawal timeline; urge log with intensity/trigger + breathing/PMR (Plus); community feeds segmented by addiction × milestone stage; Workbook (CBT-ish); widgets + Watch; supporter invitations (Plus); invite-only Groups. No AI, no panic button.
- Moderation: automated filters + user flags/bans; "relies on user reports"; reviews report self-harm encouragement and minors.
- Pricing: free core (2 trackers); Sober Plus $9.99/mo, $29.99–49.99/yr, **$64.99 lifetime**, 7-day trial.
- Complaints: Premium "doesn't offer much more value", notifications "come all at once", text-heavy UI.

**Sunnyside** (ex-Cutback Coach) — https://www.sunnyside.co/
- **Moderation/mindful drinking** first; also sells naltrexone ($99/mo).
- Core loop: Sunday weekly plan (per-day targets + dry days) → daily SMS reminder → **log drinks by texting** → morning confirmation; dashboard: drinks cut, dry days, money, calories, sleep. "3 minutes a day".
- Human text coaches; community prompt feed. No badges, SOS, meditation.
- Relapse framing: no reset — "Hey, you did your best. Let's try again today".
- Pricing: 15-day trial then paid only: $99/yr Basic, $298/yr Coach; 4.8★/2.3K. Complaints: coaching "generic, robotic-like", excessive messaging. https://www.healthline.com/health/sunnyside-app-review
- Evidence: Aug 2024 ACER study, 33% weekly reduction over 12 weeks.

**Sober Grid** — DEFUNCT (Nov 2023). Historical: GPS "grid" of nearby sober users, DMs, badges/Quests, **"Burning Desire" button** turning your tile red to broadcast need for support, "Need a Ride", paid peer coaching. https://en.wikipedia.org/wiki/Sober_Grid

**Loosid** — Sober lifestyle network: groups, sober dating, events; counter with milestones; "Sobriety Help" SOS post + hotline; **SAM** premium (daily emotional check-in, journal, sponsor linking, "SAM AI"). Free core; Plus $12.99/mo; SAM $9.99/wk–$79.99/6mo. 4.7★/7.2K. Complaints: "very nearly ZERO events", bots.

**Nomo** (solo dev, free, donation-funded) — https://saynomo.com/ — Unlimited clocks, milestone **chips**, money/calories, **accountability partners** (share clocks, "I'm tempted" + reset notifications, encrypted chat), Encouragement Wall, daily-inventory journal, "Refocus" craving mini-games, widgets, PIN. 4.8★/16K. Complaints: DST bug, partner matching unresponsive.

**Sober Time** (Sociosoft) — Precision counter, goal ladder + milestone badges, money saved, **Health Timeline**, journal with prompts, **relapse tracking with notes**, Discourse forum with moderator team and rules, widgets + Watch (premium). Free w/ ads; Premium $4.99/mo or $29.99/yr. 4.8★/41K. Complaints: ads, no education/urge tools.

### 1C. Smoking / vaping

**Smoke Free** (David Crane PhD, UK) — https://smokefreeapp.com/
- "Evidence-based", 40+ behaviour-change techniques mapped to NICE/NCSCT; NHS councils buy Pro; 8M+ downloads.
- Core loop: dashboard (time, money, health across 15 body parts) → daily **Mission** (Pro, 32 days) → craving diary (severity, trigger, location, what worked) → **AI Quit Coach** chat (pings 2×/day in month one).
- 92 badges; savings countdown to a chosen treat; distraction game; Pro chatroom with NCSCT advisors. Relapse: change quit date, diary preserved.
- Pricing: free tracker/diary ad-free; Pro $6.99–9.99, Complete $29.99, "Money Back Guarantee" $49.99. 4.8★/57K.
- **Evidence (strongest in category):** RCT n=28,112, OR 1.90 (https://f1000research.com/articles/7-1524/v1); chatbot 2× logins, aOR 2.38 abstinence; RAUCHFREI RCT n=1,466, 6-mo abstinence 39.3% vs 24.4% (https://www.medrxiv.org/content/10.64898/2026.03.17.26348617v1.full); pragmatic offer-only RCT n=3,143 was null (https://pmc.ncbi.nlm.nih.gov/articles/PMC11607577/).

**QuitNow!** (Fewlaps) — Community-first counter (live chat rooms), WHO health indicators, 80 achievements, 28 languages, Watch/Wear OS, AI Q&A. **One-time lifetime PRO $34.99**. 4.7★/14K. Complaints: unmoderated chat, paywalled health screen, hard reset on relapse.

**Kwit** (France) — https://kwit.app/en
- Gamified CBT: XP, levels, 84+ achievements, shake-for-motivation-card, diary of cigarettes/cravings/emotions, "I have a craving" flow (breathing, cards, mini-games), NRT/vape tracking, 9-step preparation program, forum, widgets.
- **Relapse: "guilt-free"** — counters don't reset; an **energy curve** drops when you log a cigarette and recovers.
- Pricing: $6.49/wk, $17.99–20.99/mo, $46.99–127.99/yr, $169.99 lifetime; 3-day trial. 4.7★. Complaints: "70€ for a simple app", surprise post-trial charges. Evidence: feasibility study — only 2.4% completed the 9-step program (https://pmc.ncbi.nlm.nih.gov/articles/PMC11483257/).

**Pelago (ex-Quit Genius)** — B2B2C virtual clinic (employer-covered) for tobacco/alcohol/opioids: daily check-in, CBT audio mini-sessions, weekly review, human coach/physician, NRT shipped, CO breath test. Evidence: RCT n=530, 4-week abstinence 44.5% vs 28.3% (https://pmc.ncbi.nlm.nih.gov/articles/PMC9597001/).

**EasyQuit** — Privacy-first (local, no login), **Slow Mode** gradual-reduction schedule, health countdown timers, 62–100+ badges, memory game for the "3-minute craving", trigger stats, relapse assistant (Pro), widgets, themes. Free w/ ads; **Pro $4.99 one-time**. 4.7★.

**Vaping:** **Puff Count** (tap-per-puff tapering, daily limit, Quit Buddies; $3.99–9.99/mo, hard paywall after 3-day trial); **Jones** (free, monetised by nicotine mints; daily check-in + mood, CBT prompt, "Quittle" mini-game, AI Coach, 30-day SMS program; 4.8★); **Quit Vaping** (4.9★/12K; buddy system, forum, cold-turkey or daily-reduction plan, selfie-a-day; $19.99/mo, $99.99/yr).

### 1D. Phone / social media

| App | Positioning | Mechanism | Hard lockout | Pricing | Rating |
|---|---|---|---|---|---|
| **Opal** | premium "attention on autopilot"; Focus Score, gems, leaderboards, Live Activities | iOS Screen Time API (moved from VPN in 2022); Mac app | Deep Focus (Pro) with uninstall protection | free 1 session; $19.99/mo, $99.99/yr, $399 lifetime; 7-day trial | 4.7/87K |
| **one sec** | research-backed friction ("take a breath"), intentions, Doomscroll Emergency Brake | Shortcuts automation + FamilyControls/ManagedSettings/DeviceActivity; Android Accessibility | Strict Block + Screen Time lock (iOS 26.4) | free 1 app; $2.99/mo, $19.99/yr, $99.99 lifetime | 4.8/23K |
| **ScreenZen** | free, donation-supported; escalating delays (10s→30s→60s), opens cap, streaks, widget; Halo BLE puck $49 | Screen Time API + Shortcuts; Android Accessibility + overlay | strict modes, settings lock | free; tips $5–40 | 4.9/49K |
| **Freedom** | cross-device blocker (desktop+mobile) | iOS: Screen Time for apps + local VPN for sites; Android: Accessibility + Device Admin | Locked Mode (Premium) | 7 free sessions; $8.99/mo, $39.99/yr, $99.50 Forever | 4.4/5.8K |
| **Forest** | gamified Pomodoro; tree dies if you leave; real trees planted | foreground detection + Screen Time allow-list | none | free; Plus $5.99/mo, ~$35/yr | 4.8/49K |
| **Jomo** | Opal-class rules for ~30% of price; effort-based unlocks (walk, copy text, photo proof), squads | Screen Time API (iOS/Mac only) | Strict Mode (Plus) | free 1 rule; $5.99/mo, $29.99/yr, $99.99 lifetime | 4.8/2.3K |
| **Brick** | $59 NFC puck; leave it at home | Screen Time API / Accessibility toggled by NFC; 5 lifetime emergency unbricks | Strict Mode + physical tap | $59 one-time | 4.9 iOS / 4.0 Play |

Also: **Clearspace** (camera-verified pushups to unlock, teammates notified on overage, $44.99–59.99/yr), **Roots** ("Digital Dopamine" score, Monk Mode, streak "cheat days", $59.99/yr), **Refocus** (passcode/NFC/delay/copy-text unlock gates, location blocking).

Evidence: one sec PNAS 2023 (n=280): 36% of open attempts abandoned, 57% fewer openings after 6 weeks; the *cancel option* was the most effective component (https://www.pnas.org/doi/10.1073/pnas.2213114120). CHI 2024 (n=1,039): users take breaks from interventions and rebound. Users report autopiloting through prompts within ~10 days–3 weeks.

### 1E. General / gamification

- **Quitzilla** — multi-habit counter; money saved → "buy" user-defined rewards, trophies, reasons list, relapse diary; reset keeps history/longest streak. 4-step habit setup **before** a soft paywall. Free 2 habits; $5.99/wk, $29.99/yr, $89.99 lifetime. 4.8★. https://screensdesign.com/showcase/quitzilla-quit-tracker
- **Habitica** — RPG: avatar loses HP for missed dailies, XP/gold, parties where missed dailies damage the whole party. Free core; $4.99/mo cosmetics. Complaints: learning curve, gamification "gets in the way".
- **Streaks** — $5.99 one-time "don't break the chain", 24 habits incl. negative; the "no resentment" pricing benchmark.
- **Sober Sidekick** — free anonymous community with an "Empathy Algorithm" guaranteeing every post gets replies (avg 6+, <4 min); onboarding nudges *giving* support first (helpers show 5× retention); relapse-risk prediction ~2 weeks ahead; 88% of self-reported relapsers re-engage. https://amplitude.com/blog/sober-sidekick-amplitude
- **Recovery Path** — MI/CBT/CRA: morning/evening check-ins, meeting finder (AA/NA/SMART), **geofenced "Places to Avoid" alerts**, Beacon crisis messaging, linked clinician/sponsor/family apps; free.
- **AI coaches:** Freed (Quit Porn; hard paywall after long questionnaire), Yana, **Woebot shut down June 2025** (FDA cost; RCT d≈0.44).

## Part 2 — Feature matrix (12 apps × 16 features)

Y = yes/core; P = partial or paid-only; – = absent; ? = undocumented.

| Feature | Brainbuddy | Fortify | BlockerX | Covenant Eyes | I Am Sober | Reframe | Sunnyside | Smoke Free | Kwit | Opal | one sec | Nomo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Streak / counter | Y | Y | P (stats) | – | Y (to sec) | Y + drink log | drinks/dry days | Y | Y (no reset) | Focus Score | attempts saved | Y (multi) |
| Milestones / badges | challenges | badges/points | – | – | Y + celebration | Recoins | – | 92 badges | 84+ / XP levels | gems | – | chips |
| Money / health timeline | rewiring 100d | risk analytics | – | – | money/time/cal + withdrawal | spend/cal/BAC | money/cal/sleep | money + 15-body-part health | money/life-expectancy | time saved | time saved | money/cal |
| Panic / urge button | Craving Control + ally notify | weak | Panic Switch (kill internet) | – | urge log + breathing (P) | SOS: urge-surf audio, games | text coach | craving diary + game + chatbot | breathing, cards, games | – | – (is the intervention) | Refocus games |
| Community | anonymous teams | forums | forum (P) | prayer/encouragement | feeds by addiction × milestone | forum + DMs | prompt feed | Pro chatroom w/ advisors | forum groups | leaderboards | – | walls + partners |
| Pledge / daily check-in | – | daily check-in | – | daily commitment | **pledge + review** | daily tasks | daily SMS | missions (P) | daily activities | – | – | – |
| Journal / mood | Y | Y | – | – | Y | Y | light | craving log | Y | – | Y | Y |
| Education / CBT | 100-day program | 15 Learning Paths | articles/courses | mini-courses | Workbook | 160-day program | tips/videos | 40+ BCTs | CBT + TTM | – | – | – |
| Meditation / breathing | Y | Y | – | – | breathing/PMR | Y | – | limited | P | soundscapes | breathing pause | – |
| Blocker | Y | – | Y (a11y/VPN) | screenshots + VPN | – | – | – | – | – | Y (Screen Time) | Y (Shortcuts + Screen Time) | – |
| Accountability partner | ally on panic | **Allies** | daily reports + alerts | **core** | supporter (P) | – | human coach | advisors | support chat | friends | – | **partners + chat** |
| AI coach | – | AI coaching 24/7 | "AI buddy" (broken) | – | – | Melody (paid) | no (human) | Quit Coach | – | – | – | – |
| Widgets | ? | – (requested) | – | – | Y + Watch | ? | ? | ? | Y | Y + Live Activity | – | Y |
| Gamification | Life Tree | points | – | – | milestones | Recoins | – | badges, Inner Dragon | XP/levels/energy | gems, leaderboards | – | chips |
| Relapse framing | weak | "setback", shame-free | – | ally conversation | manual reset, history kept | "failed" per-day | "try again today" | move quit date | **no reset, energy dips** | n/a | n/a | reset clock |
| Onboarding → paywall | quiz → 7d trial → $12.99/mo | assessment → free tier | setup → premium | paid only | pick addiction → free | quiz → 7d trial → paid only | quiz → 15d trial → paid | plan → Pro upsell | quiz → 9-step, steps 3–7 paid | setup → Pro | 1 app free | none, free |

## Part 3 — Category patterns

### 3.1 Onboarding quiz → personalised plan → paywall
- Standard for program apps (Brainbuddy, Reboot, Reframe, Sunnyside, Kwit, Freed). QUITTR: 12-page quiz + hard paywall converting ~25% of downloads.
- Benchmarks: quiz completers convert far above the 2.7% median (Noom >10%); hard paywalls give 20–40% more immediate trial starts but freemium yields 15–25% more 12-month revenue; trials of 17–32 days convert ~45.7% vs 26.8% for 3–7 day; a "commitment screen" before pricing lifts conversion. https://www.rocketshiphq.com/paywall-optimization-fitness-apps/
- Dark patterns users punish: delayed close button, monthly price shown but annual billed, fake countdowns, weekly SKUs, post-quiz surprise paywall, trial auto-conversion. Billing complaints are the #1 negative theme for every paid-only app.
- Price bands: program apps $12–13/mo; trackers $30–50/yr or $60–90 lifetime; blockers $110–200/yr, $150–950 lifetime; screen-time $20–100/yr. One-time (Streaks $5.99, EasyQuit $4.99, QuitNow $34.99, Brick $59) and free/donation (Nomo, ScreenZen, Rewire Companion, Sober Sidekick) are the "no resentment" options.

### 3.2 Streak psychology
- Loss aversion drives it: Duolingo's streak freeze cut churn 21% for at-risk users; repairable streaks reduce abandonment (Silverman & Barasch JCR 2023). https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Downside in recovery: **abstinence violation effect** — a single slip read as total failure → shame → relapse; strict zero-reset apps see drop-off right after the first break ("People do not rebuild. They leave."). https://recovery.com/resources/to-count-or-not-to-count-the-pros-and-cons-of-counting-sobriety-days/
- Alternatives: total clean days alongside streak (Reboot), win-rate over rolling 30 days, "energy" curve (Kwit), cheat days/streak freezes (Roots), relapse logged with note + trigger (Sober Time, Quitzilla), longest-streak preserved (Quitzilla).

### 3.3 Relapse handling
- Marlatt & Gordon: **lapse** (single use) vs **relapse** (return to pattern); RP tools = lapse-management plan, cognitive restructuring, urge surfing. https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/
- Good practice: I Am Sober (pledge failure ≠ reset; undoable; history kept), Fortify ("setback"), Sunnyside ("try again today"), Kwit (no reset), Sober Time (relapse note), Smoke Free (move quit date). Anti-patterns: Reframe's per-day "you failed", Brainbuddy's missing "how to get back up", hard resets. Sober Sidekick's non-punitive response retains 88% of relapsers.

### 3.4 Notifications
- Effective cadence: Smoke Free chatbot 2×/day in month one; I Am Sober morning pledge + evening review; Sunnyside daily SMS + Sunday plan. Algorithmically timed reminders → 82% adherence vs 67% self-scheduled vs 49% control.
- JITAI frontier: Quit Sense geofences smoking locations and messages after ≥5 min there — 6-month abstinence 11.5% vs 2.9% (https://academic.oup.com/ntr/article/25/7/1319/7116281); Recovery Path "Places to Avoid"; Sober Sidekick relapse prediction.
- Fatigue: "these reminders don't seem to be working, we'll stop" (Duolingo). Complaints: notifications "come all at once", leaking during blocks, not restarting after reset.

### 3.5 Community moderation
- Failure modes: self-harm encouragement, minors despite 18+ gate, moderation "relies on user reports" (I Am Sober); unmoderated live chat used for dating (QuitNow); unmoderated DMs (Reframe); bots (Loosid); groups dissolved (Brainbuddy).
- Better practice: Sober Time's Discourse forum with mod team + rules; Sober Sidekick's guaranteed-response, 18+, anonymity, "Talk to Someone Now"; Recovery Path's crisis messaging; Relay's therapist-facilitated small groups; r/stopdrinking's daily check-in ritual. Moderators should route crisis to 988. https://www.integrative-psych.org/resources/online-peer-support-communities-benefits-risks-moderation-mental-health-impact

### 3.6 Content blocking: iOS vs Android
**iOS**
- **Screen Time API** (FamilyControls → ManagedSettings shields → DeviceActivity schedules; ShieldConfiguration/ShieldAction extensions). Used by Opal, Jomo, Forest, Brick, ScreenZen, one sec, Freedom, Covenant Eyes, QUITTR. Limits: 50 tokens per shield category, 20 monitored activities, 15-min minimum interval, 6 MB extension memory, tokens regenerate, no API to open target app from a shield, and — until **iOS 26.4** — permission revocable by one Settings toggle; 26.4 adds passcode-locking of third-party Screen Time permission. Reliability complaints (thresholds not firing) hit all apps. https://riedel.wtf/state-of-the-screen-time-api-2024/ · https://one-sec.app/blog/lock-screen-time-permission/
- **Web domain shielding** covers Safari only; links opened in other apps / third-party browsers are the standard bypass.
- **Local VPN / DNS profile** (NEPacketTunnel / NEFilterProvider): Freedom sites, BlockerX, Remojo, Covenant Eyes, Canopy. Pros: all browsers, category-level. Cons: one VPN at a time, profile deletable, cellular/call disruption, false "VPN off" alerts, battery. Uninstall protection unavailable on iOS — apps can only notify a partner. https://www.techlockdown.com/articles/block-porn-iphone
- **Shortcuts automation** (one sec): "open app" trigger runs an intervention; no entitlement, but only interrupts and can be deleted.
- **Physical key** (Brick, Refocus NFC, ScreenZen Halo): moves the unlock key off the device.

**Android**
- **AccessibilityService**: reads foreground text/URLs to block sites/keywords in any browser + overlay — BlockerX, Remojo, one sec, ScreenZen, Freedom, Brick, Covenant Eyes. Policy risk: Play requires prominent disclosure; **Android 17 Advanced Protection auto-revokes accessibility for non-accessibility-tool apps**; OEM battery savers kill services. https://support.google.com/googleplay/android-developer/answer/10964491 · https://thehackernews.com/2026/03/android-17-blocks-non-accessibility.html
- **VpnService** local DNS filter: cross-browser incl. incognito, SafeSearch enforcement.
- **Device Admin**: prevents uninstall without partner approval.
- **UsageStats**: usage-based limits.
- Bypasses to handle: uninstall, safe mode, new browser installs, private DNS change, second VPN, guest profile, factory reset; mitigations are layering + partner alerts. https://www.techlockdown.com/articles/block-porn-android

**Cross-cutting:** blockers are "external policing" and habituate/bypass; the best-rated apps pair a blocker with an "internal rewiring" program; friction effects plateau ~30% after 2–3 weeks unless a hard mode or partner-held key exists.

## Part 4 — Differentiators and gaps

**Worth borrowing**
- I Am Sober's decoupled pledge/reset and milestone-stage community segmentation.
- Kwit's no-reset "energy" curve; Reboot's total-clean-days metric.
- Remojo's Panic Mode (internet off 10–120 min + partner ping) and bets/penalties; Sober Grid's "Burning Desire" broadcast; Loosid's "Sobriety Help" post.
- Plucky's delayed-effect settings ("choose in moments of strength"); one sec's Strict Block + iOS 26.4 permission lock; Brick's off-device key.
- Sober Sidekick's guaranteed-response community and "give support first" onboarding; Relay's therapist-led matched small groups.
- Smoke Free's 2×/day chatbot in month one and mission structure (RCT-supported); Quit Sense/Recovery Path geofenced JIT nudges.
- Fortify's Allies with granular data sharing; Nomo's "I'm tempted" partner push.
- Jomo/Clearspace effort-based unlocks (walk, copy text, photo proof).

**What users say is missing or poorly done**
1. **Relapse recovery content** — most apps handle the reset screen, not the 48 hours after.
2. **In-the-moment urge tools beyond quotes** — only Reframe, Remojo, Kwit, Smoke Free have multi-modal urge flows.
3. **Reliable blocking without false alarms** — VPN-off false positives, Safari-only coverage, Screen Time flakiness, Android accessibility revocation; no consumer app has uninstall protection on iOS.
4. **Widgets/Watch** — frequently requested.
5. **Moderation and safety** — minors, self-harm content, dating misuse, unmoderated DMs, bots.
6. **Pricing transparency** — surprise post-quiz paywalls, weekly SKUs, trial auto-conversion, cancellation friction.
7. **Data durability** — check-in loss, reinstall wipes, sync bugs.
8. **Friction habituation** — breathing pauses become autopilot within weeks.
9. **Android parity** — many apps are iOS-first.
10. **Evidence** — only Smoke Free, Pelago, one sec, Sunnyside have trial data; porn-recovery apps rely on self-reported claims.
11. **Gamification fatigue** — leaderboards "bloat", guilt backfire.
12. **Whole-person tools** — sleep/mood/stress integration and replacement habits, not just counters (JMIR 2025: https://mhealth.jmir.org/2025/1/e63148).

## Part 5 — Evidence-based techniques and who uses them

| Technique | Source / evidence | Apps |
|---|---|---|
| **CBT for SUD** | NIDA manual; modest durable effects | Reframe, Brainbuddy, Fortify, Pelago, Kwit, Smoke Free, I Am Sober workbook, Recovery Path, Jones |
| **Urge surfing / MBRP** (Marlatt) | Bowen 2014 RCT: 31% fewer drug-use days at 12 mo | Reframe SOS, I Am Sober urge tool, Kwit craving flow, Remojo Urge Manager |
| **Implementation intentions** (if-then plans) | d≈0.65 general; substance g=0.31 | one sec/ScreenZen intention prompts, SMART Change Plan; rarely explicit in recovery apps |
| **Relapse prevention** (lapse vs relapse, AVE) | PMC6760427 | Fortify "setback", I Am Sober, Kwit energy, EasyQuit relapse assistant |
| **HALT** | AA heuristic | Content in most apps; none operationalises it as a check-in |
| **SMART Recovery** 4-Point (ABC, CBA, DISARM, urge log, Change Plan) | REBT-based | Official SMART app; Recovery Path; slips-as-data framing (Reboot/Kwit) |
| **Motivational interviewing** | small short-term effects | Recovery Path, Pelago coaching, Sunnyside coaches |
| **12-step vocabulary** (one day at a time, chips, daily inventory, sponsor) | — | I Am Sober pledge, Nomo chips, Sober Time medals, Loosid SAM, Relay Three Circles |
| **Commitment devices** | Ariely & Wertenbroch | Freedom Locked Mode, Opal Deep Focus, one sec Strict Block, Brick, Plucky delay, Remojo bets, Habitica party damage |
| **Friction / self-nudging** | one sec PNAS 2023 | one sec, ScreenZen, Clearspace, Jomo |
| **Loss aversion / streaks with repair** | Duolingo; Silverman & Barasch 2023 | Forest tree death, streak freezes (Roots), all counters |
| **Contingency management** | d=0.58 abstinence (Bolívar 2021) | Quitzilla money→reward, Smoke Free savings-to-treat |
| **JIT adaptive / geofencing** | Quit Sense aOR 4.46 | Recovery Path, Sober Sidekick prediction, Refocus location blocking |
| **Peer support with guaranteed response** | A-CHESS RCT | Sober Sidekick, Relay groups, Sober Time forum |
| **Psychoeducation / health timelines** | WHO milestones | Smoke Free, QuitNow, Kwit, Sober Time, I Am Sober, Reframe |

**Peer-reviewed outcomes to cite:** Smoke Free (multiple RCTs, OR 1.9–2.0), Pelago (n=530, 44.5% vs 28.3%), one sec (PNAS n=280), A-CHESS (n=349), Quit Sense JITAI, Kwit feasibility (2.4% completion), gamified-cessation meta-analysis (RR 1.91 short-term fading to 1.37 at 6+ mo, https://pmc.ncbi.nlm.nih.gov/articles/PMC12199787/). Reframe, Fortify, Brainbuddy, BlockerX, and all porn-recovery apps have self-reported claims only.
