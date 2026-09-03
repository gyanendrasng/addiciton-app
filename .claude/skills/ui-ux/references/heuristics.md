# Heuristics — and what they mean for this app

Two canonical sets, annotated for Curb. When a screen feels wrong but you can't say why, read down these lists; the answer is nearly always here.

Sources: Nielsen Norman Group's 10 Usability Heuristics; Laws of UX (lawsofux.com).

---

## Nielsen's ten

**1. Visibility of system status.** Keep the user informed with appropriate feedback.
→ A tap must produce a visible response inside 100ms — the press state, not the result. Every network action has a busy state on the control that started it. The streak header states the day plainly; progress toward the next milestone is always visible, never implied.

**2. Match between system and the real world.** Familiar words, real-world conventions.
→ "Slip", "urge", "check-in", "streak" — the words the user already uses. Never "event logged", never "entity". A calendar looks like a calendar.

**3. User control and freedom.** Emergency exits; undo.
→ Every modal has a visible dismiss. The relapse flow has a 24-hour **undo** — logging a slip is the most emotionally loaded action in the app and must be reversible. Onboarding has a back button on every step.

**4. Consistency and standards.** Internal consistency, plus platform convention.
→ One `Tap`, one `Card`, one `Notice`, one `SymbolChip` — a second variant of an existing component is a bug. Follow iOS convention: sheets swipe down, back is a left chevron, destructive is red in an alert. (Jakob's Law: users expect this app to work like the apps they already have.)

**5. Error prevention.** Design out the error before writing the message.
→ Disable "Sign in" until the code is six digits. Constrain the code field to digits. Double-confirm account deletion. Default the reminder times to something sensible rather than asking.

**6. Recognition rather than recall.** Make things visible.
→ Show the user's own reasons inside the urge flow at the moment they need them — don't ask them to remember why they started. Show the habit chips; don't make them recall which habits they picked.

**7. Flexibility and efficiency.** Shortcuts for the experienced, invisible to the new.
→ Tapping a habit chip goes straight to logging for that habit. Skip buttons appear in the urge flow after a delay — present for the returning user, not shouted at the first-timer.

**8. Aesthetic and minimalist design.** Remove what isn't needed.
→ One job per screen. If a second idea is competing for the largest type, it belongs on another screen. The home screen was rebuilt for exactly this reason.

**9. Help users recognise, diagnose and recover from errors.** Plain language, no codes, suggest the fix.
→ **This is the one this app kept failing.** Never surface a raw error. Every message goes through `humanError` in `src/lib/errors.ts`: say what happened, in a sentence, and what to do — "Couldn't reach Curb. Check your connection and try again." No stack frames, no module paths, no status codes. Present it in a `Notice`, not as bare red text.

**10. Help and documentation.** Contextual, task-focused.
→ Inline, at the point of confusion. Tapping the streak explains how a streak breaks. The tier names explain themselves where they appear.

---

## Laws of UX — the ones that bite here

**Fitts's Law.** Time to acquire a target scales with distance and size.
→ Primary actions are full-width and in the bottom third. The urge button is the biggest thing on the home screen because it's needed in a hurry.

**Hick's Law.** Decision time grows with the number of choices.
→ Three sign-in providers, not six. One primary button per screen. The paywall offers a small number of plans.

**Miller's Law.** Working memory holds about 7±2 items.
→ Group into chunks of 3–5. Onboarding asks one question per screen. Never a list of ten unlabelled options.

**Jakob's Law.** Users expect this app to work like the others they know.
→ Don't reinvent tabs, sheets, or the back gesture. Novelty goes into the hero moments, not the navigation.

**Aesthetic-Usability Effect.** Beautiful is perceived as more usable — and buys tolerance for minor problems.
→ Why this skill exists. Also why a single unstyled screen damages trust in the whole app.

**Doherty Threshold.** Interaction under **400ms** keeps attention.
→ Every animation that gates an interaction stays under 300ms. Optimistic UI where the local write can't fail: log the pledge immediately, don't wait.

**Von Restorff Effect.** The thing that differs is remembered.
→ Exactly one element per screen breaks the visual pattern, and it's the primary action. If three things stand out, nothing does.

**Peak-End Rule.** An experience is judged by its peak and its end.
→ The milestone celebration is the peak — it earns real motion. The end of the urge flow is "Urge survived", and it must feel like a win. The end of the relapse flow must feel like being caught, not judged.

**Goal-Gradient Effect.** Motivation rises as the goal nears.
→ Always show distance to the next milestone, not just the total. Progress toward something close beats a big abstract number.

**Zeigarnik Effect.** Unfinished tasks stay on the mind.
→ An unfinished check-in shows as unfinished. Never nag; showing the gap is enough.

**Serial Position Effect.** First and last items are remembered best.
→ Put the most important item first and the primary action last.

**Law of Proximity / Common Region.** Nearness groups; a shared boundary groups harder.
→ Group with spacing first, a card second. Never with a border alone.

**Tesler's Law.** Complexity can't be removed, only moved.
→ Multi-addiction tracking is genuinely complex. The app absorbs it (per-habit streaks computed for you) rather than exporting it to the user as configuration.

**Postel's Law.** Be liberal in what you accept, conservative in what you send.
→ Trim and lowercase emails; strip non-digits from the code field; accept a pasted code with spaces. Send precise, well-formed output.

**Choice Overload / Paradox of the Active User.** People don't read; they start tapping.
→ No tutorial the user must read. Teach through the first real interaction.
