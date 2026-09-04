import Link from 'next/link';
import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Curb handles your data: what stays on your device, what we receive, and what we never collect.',
};

export default function Page() {
  return (
    <LegalPage title={'Privacy Policy'} updated={'Effective 3 September 2026 · Version 1.0'}>
<Callout>
    <p><strong>The short version.</strong> Curb keeps your recovery record — habits,
    streaks, check-ins, urges, slips, reasons and notes — so the app can show it back to
    you. It is held on your device and, where needed to provide the service, on our
    servers. We also hold your <a href="#account">email address</a>, your{' '}
    <a href="#purchases">subscription status</a> and{' '}
    <a href="#analytics">usage and progress data</a>.</p>
    <p><strong>We do not sell it, we do not share it for advertising, and we do not use it
    to track you across other apps.</strong> You can export everything, and you can delete
    everything — both are in Settings, and section 8 explains how.</p>
  </Callout>

  <div className="my-8 rounded-2xl bg-surface px-6 py-5">
    <ol>
      <li><a href="#who">Who we are</a></li>
      <li><a href="#ondevice">What Curb stores on your device</a></li>
      <li><a href="#leaves">Data that leaves your device</a></li>
      <li className="ml-4"><a href="#account">— Your account</a></li>
      <li className="ml-4"><a href="#purchases">— Subscription purchases</a></li>
      <li className="ml-4"><a href="#analytics">— Usage and progress data</a></li>
      <li><a href="#notifications">Notifications</a></li>
      <li><a href="#export">Exporting your data</a></li>
      <li><a href="#nosale">No selling, sharing or advertising</a></li>
      <li><a href="#rights">Your rights</a></li>
      <li><a href="#legal-basis">Legal basis for processing</a></li>
      <li><a href="#children">Children</a></li>
      <li><a href="#retention">Retention and deletion</a></li>
      <li><a href="#security">Security</a></li>
      <li><a href="#changes">Changes to this policy</a></li>
      <li><a href="#contact">Contact</a></li>
    </ol>
  </div>

  <h2 id="who">1. Who we are</h2>
  <p>Curb (“Curb”, “we”, “us”) is a mobile application that helps people track and reduce
  addictive habits. This policy explains how the app handles information. It applies to
  the Curb iOS and Android apps and to this website, <strong>joincurb.app</strong>.</p>
  <p>
    <strong>Data controller:</strong> Gyanendra Singh<br />
    <strong>Postal address:</strong> 110/05 Pinto Park, Delhi Cantt, New Delhi 110010, India<br />
    <strong>Email:</strong> <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a>
  </p>

  <h2 id="ondevice">2. What Curb stores on your device</h2>
  <p>Curb stores the following in a local database inside the app’s private storage area
  on your phone. <strong>None of it is transmitted to us, and we have no ability to access
  it.</strong></p>
  <table>
    <thead><tr><th>What</th><th>Examples</th></tr></thead>
    <tbody>
      <tr><td>Habits you track</td><td>Porn, alcohol, smoking, vaping, weed, social media, gambling, other</td></tr>
      <tr><td>Onboarding quiz answers</td><td>Frequency, how long, triggers, symptoms you selected, age range, goal</td></tr>
      <tr><td>Streak &amp; program data</td><td>Quit date, current and longest streaks, milestones reached</td></tr>
      <tr><td>Daily activity</td><td>Pledges, evening check-ins (mood and difficulty ratings), optional notes</td></tr>
      <tr><td>Urge records</td><td>When an urge occurred, its trigger and intensity, the outcome, how long it lasted</td></tr>
      <tr><td>Slip records</td><td>Which habit, the trigger, your notes, the next actions you chose</td></tr>
      <tr><td>Your reasons</td><td>The free-text reasons you wrote for quitting</td></tr>
      <tr><td>Preferences</td><td>Reminder times, theme, whether reminders are on</td></tr>
    </tbody>
  </table>
  <p>This is sensitive information about health and behaviour, and we treat it that way:
  access is restricted, it is never sold, and it is never used for advertising. Some of it
  also reaches our servers — see <a href="#leaves">section 3</a> for exactly what, and{' '}
  <a href="#rights">section 8</a> for how to get it deleted.</p>
  <Callout tone="warn">
    <p><strong>Keep your own copy.</strong> <em>Settings → Export everything</em> writes a
    JSON file of your Curb data that you can store wherever you like. Don’t rely on us to
    restore a lost phone.</p>
  </Callout>

  <h2 id="leaves">3. Data that leaves your device</h2>
  <p>Described in full below.</p>

  <h3 id="account">a. Your account</h3>
  <p>Curb requires an account so that a subscription you buy on one phone works on your
  next one. When you sign in with Apple, Google or an email code, we store on our servers:
  your <strong>email address</strong>, an internal user identifier, the sign-in provider
  you used, an optional display name you can set yourself, and session records (created
  date, and the device type and IP address of the sign-in, used to let you sign out other
  devices).</p>
  <p>If you use <strong>Sign in with Apple</strong> and choose “Hide My Email”, we receive
  only Apple’s private relay address, never your real one. We do not store passwords —
  there are none.</p>
  <p>Deleting your account in <em>Settings → Manage account → Delete account</em> removes
  all of this from our servers. Your on-device data is untouched by that.</p>

  <h3 id="purchases">b. Subscription purchases</h3>
  <p>Curb offers a paid subscription and a one-time lifetime option. Payment is handled
  entirely by <strong>Apple</strong> or <strong>Google</strong> — we never see or receive
  your card details, billing address, or Apple/Google account credentials.</p>
  <p>To know whether your subscription is active, the app uses{' '}
  <strong>RevenueCat</strong>, a subscription-management service. RevenueCat receives a
  randomly generated, pseudonymous app-user identifier together with the purchase receipt
  and subscription status issued by the store. It does not receive your name, email, or any
  of the recovery data listed above. See{' '}
  <a href="https://www.revenuecat.com/privacy" rel="noopener noreferrer" target="_blank">RevenueCat’s privacy policy</a>.</p>
  <p>For store-privacy purposes this is disclosed as <em>Purchases → Purchase history</em>,
  used for app functionality and analytics, not linked to your identity, and not used to
  track you across apps or websites.</p>

  <h3 id="analytics">c. Usage and progress data</h3>
  <p>Curb sends product analytics to{' '}
  <a href="https://posthog.com/privacy" rel="noopener noreferrer" target="_blank">PostHog</a>,
  so we can see which parts of the app help and which are ignored. It receives:</p>
  <ul>
    <li><strong>Interaction events</strong> — screens opened, buttons used, where people
    stop during onboarding, whether a purchase was started or completed.</li>
    <li><strong>Progress data</strong> — which habits you are tracking, how long your
    streaks run, how many slips and urges you have logged, which milestones you reach.</li>
    <li><strong>Technical context</strong> — app version, platform, device model, and a
    pseudonymous identifier.</li>
  </ul>
  <p>Because the habits you track say something about your health, we treat this as
  sensitive personal information. It is used to improve Curb — never sold, never shared
  for advertising, and never used to build a profile of you for anyone else. You can turn
  analytics off in <em>Settings</em>; the rest of the app works exactly the same.</p>

  <h3 id="updates">d. App updates</h3>
  <p>Curb can receive improvements and fixes without a full store update, using{' '}
  <strong>Expo Application Services (EAS Update)</strong>. When the app launches it asks
  Expo’s servers whether a newer version of the app’s code is available. That request
  contains only technical details — platform (iOS/Android), the app’s runtime version, the
  update channel, the identifier of the version currently installed — and, as with any
  internet request, your IP address. It contains none of your content. See{' '}
  <a href="https://expo.dev/privacy" rel="noopener noreferrer" target="_blank">Expo’s privacy policy</a>.</p>

  <h3>e. This website</h3>
  <p>joincurb.app is a static site. It sets no cookies and runs no advertising or analytics
  scripts. Fonts are loaded from Google Fonts, which receives your IP address as part of
  serving the font files.</p>

  <h2 id="notifications">4. Notifications</h2>
  <p>Curb’s reminders (a morning pledge and an evening check-in) are <strong>local
  notifications</strong> — scheduled by the app and delivered by your phone’s operating
  system. There is no push server and no push token; nothing is transmitted to us or to
  Apple/Google beyond what the OS does to display a local alert. Reminders are optional,
  can be declined during onboarding, and can be turned off at any time in Settings or in
  your device settings.</p>

  <h2 id="export">5. Exporting your data</h2>
  <p>Settings → <em>Export everything</em> writes a JSON file containing your Curb data and
  hands it to your device’s standard share sheet. We do not receive this file. Once you
  send it somewhere — email, cloud storage, another app — that destination’s own privacy
  policy governs it.</p>

  <h2 id="nosale">6. No selling, sharing or advertising</h2>
  <p><strong>We do not sell or share personal information</strong> as those terms are
  defined by the California Consumer Privacy Act as amended by the CPRA, and we do not
  process personal information for cross-context behavioural advertising. Curb contains no
  advertising SDKs and no social-media SDKs. It does contain a product-analytics SDK,
  described in <a href="#analytics">section 3c</a>, used only to improve the app. You can
  switch it off in Settings, which is how we honour the CPRA right to limit the use of
  sensitive personal information. We have never sold or shared
  personal information, including in the preceding twelve months.</p>
  <p>Curb does not track you across other companies’ apps or websites, and does not request
  permission to do so.</p>

  <h2 id="rights">7. Your rights</h2>
  <p>Depending on where you live you may have rights to access, correct, delete, port,
  restrict or object to the processing of your personal information, and to opt out of its
  sale or sharing (CCPA/CPRA and other US state laws), or the equivalent rights under the
  UK/EU GDPR.</p>
  <p>Because your Curb data lives on your own device and is never sent to us, most of these
  rights are exercised directly by you and immediately:</p>
  <ul>
    <li><strong>Access and portability</strong> — Settings → Export everything.</li>
    <li><strong>Correction</strong> — edit or delete individual entries in the app; undo a
        logged slip within 24 hours.</li>
    <li><strong>Erasure</strong> — Settings → Delete everything, or delete the app. See{' '}
        <Link href="/delete-data">Delete my data</Link>.</li>
    <li><strong>Objection / restriction</strong> — stop using the app; nothing of yours is
        held elsewhere.</li>
  </ul>
  <p>For the limited purchase data held by RevenueCat, or for any question about this
  policy, email <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a>. We will
  respond within 30 days. You will never be treated differently for exercising a privacy
  right. If you are in the UK or EEA you also have the right to complain to your data
  protection authority (in the UK, the Information Commissioner’s Office).</p>

  <h2 id="legal-basis">8. Legal basis for processing</h2>
  <p>For users in the UK/EEA: because your recovery entries never reach us and we hold no
  means of identifying you from them, we do not act as a controller of that data. For the
  on-device processing the app performs at your direction, the basis is your{' '}
  <strong>consent</strong> (Article 6(1)(a)), and for health-related entries your{' '}
  <strong>explicit consent</strong> (Article 9(2)(a)), given by choosing to record them.
  For purchase data the basis is <strong>performance of a contract</strong> (Article
  6(1)(b)). You may withdraw consent at any time by deleting your data or the app.</p>

  <h2 id="children">9. Children</h2>
  <p>Curb is not directed to children. It is rated 16+/18+ and is intended for adults. We do
  not knowingly collect personal information from children under 13 (or under 16 where
  local law sets that threshold). If you believe a child has provided us with information,
  contact us and we will act on it — though in practice the app collects nothing from
  anyone.</p>

  <h2 id="retention">10. Retention and deletion</h2>
  <p>We retain nothing, because we receive nothing. Your data persists on your device until
  you delete it or remove the app. Purchase records held by Apple, Google and RevenueCat
  are retained under their own policies and applicable tax and accounting law.</p>

  <h2 id="security">11. Security</h2>
  <p>Curb’s database is stored inside the app’s private container, protected by your
  device’s operating-system sandbox and, on modern devices, by full-disk encryption tied to
  your passcode or biometrics. Network requests use HTTPS. Because we hold no copy of your
  data, there is no server of ours that can be breached — but keeping your device locked and
  updated remains the most important protection.</p>

  <h2 id="changes">12. Changes to this policy</h2>
  <p>If we change this policy we will update the effective date above and, for material
  changes, notify you in the app. Continuing to use Curb after a change means you accept
  the updated policy. Previous versions are available on request.</p>

  <h2 id="contact">13. Contact</h2>
  <p>
    Privacy questions: <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a><br />
    General support: <a href="mailto:support@joincurb.app">support@joincurb.app</a><br />
    Postal: Gyanendra Singh, 110/05 Pinto Park, Delhi Cantt, New Delhi 110010, India
  </p>
    </LegalPage>
  );
}
