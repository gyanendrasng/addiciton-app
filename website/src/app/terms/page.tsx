import Link from 'next/link';
import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Terms of Use',
  description: 'Curb terms of use, subscription terms, and medical disclaimer.',
};

export default function Page() {
  return (
    <LegalPage title={'Terms of Use'} updated={'Effective 3 September 2026 · Version 1.0'}>
<Callout tone="danger">
    <p><strong>Curb is not medical care.</strong> Curb is not a medical device and does not
    diagnose, treat, cure, or prevent any medical condition. It is a self-tracking and
    habit-support tool and is not a substitute for professional medical advice, diagnosis,
    or treatment. Always consult a qualified healthcare professional about a medical
    condition, including substance dependence, withdrawal, or mental health. Never
    disregard professional advice, or delay seeking it, because of something in this app.</p>
  </Callout>

  <Callout tone="warn">
    <p><strong>Withdrawal can be dangerous.</strong> Stopping some substances abruptly —
    alcohol and benzodiazepines in particular — can cause serious, occasionally
    life-threatening withdrawal. Do not use Curb as a reason to stop without medical
    supervision. Speak to a doctor first. If you are in crisis, see{' '}
    <Link href="/crisis">crisis and support lines</Link>.</p>
  </Callout>

  <h2 id="agreement">1. Agreement</h2>
  <p>These Terms of Use (“Terms”) are a legal agreement between you and Gyanendra Singh
  (“we”, “us”) governing your use of the Curb mobile application and joincurb.app (together,
  the “Service”). By downloading, installing or using Curb you agree to these Terms. If you
  do not agree, do not use the Service.</p>
  <p>Curb is intended for adults. You must be at least 16 years old — or 18 where required
  by the app’s store rating in your country — and able to form a binding contract.</p>

  <h2 id="what">2. What Curb is</h2>
  <p>Curb helps you record and reduce addictive habits: it tracks streaks, offers a guided
  toolkit for moments of craving, and lets you log slips and reflections. It is a personal
  tool. It provides no medical, psychological, legal or financial advice, makes no promise
  of any outcome, and does not guarantee that you will reduce or stop any behaviour.</p>

  <h2 id="responsibilities">3. Your responsibilities</h2>
  <ul>
    <li>Use Curb only for lawful, personal, non-commercial purposes.</li>
    <li>Do not attempt to reverse engineer, decompile, or interfere with the app, except to
        the extent that restriction is prohibited by law.</li>
    <li>You are responsible for your own decisions about your health and behaviour.</li>
    <li>You are responsible for keeping your own copy of your data (Settings → Export
        everything). See the data-loss note in section 8.</li>
  </ul>

  <h2 id="subscription">4. Subscriptions, trials and billing</h2>
  <p>Curb requires a paid subscription. Where a free trial is offered, its length and the
  price that follows are shown on the purchase screen before you buy.</p>
  <ul>
    <li>Payment is charged to your <strong>Apple Account</strong> or <strong>Google
        Account</strong> at confirmation of purchase.</li>
    <li>Subscriptions <strong>renew automatically</strong> unless auto-renewal is turned off
        at least <strong>24 hours before</strong> the end of the current period.</li>
    <li>Your account is charged for renewal within <strong>24 hours prior</strong> to the end
        of the current period, at the price disclosed at purchase.</li>
    <li>You can manage a subscription and turn off auto-renewal in your account settings
        after purchase — on iOS: <em>Settings → your name → Subscriptions</em>; on Android:
        <em>Google Play → Payments &amp; subscriptions → Subscriptions</em>.</li>
    <li>If you buy a subscription during a free trial, any <strong>unused portion of the
        trial is forfeited</strong>.</li>
    <li>The lifetime option is a one-time purchase, not a subscription, and does not renew.</li>
    <li>Prices may change; we will give notice and any change applies only to future
        billing periods.</li>
  </ul>
  <p><strong>Refunds are handled by Apple and Google</strong> under their own policies, not
  by us. We cannot issue store refunds directly. Request one through{' '}
  <a href="https://reportaproblem.apple.com" rel="noopener noreferrer" target="_blank">reportaproblem.apple.com</a> or
  Google Play’s refund process.</p>

  <h2 id="updates">5. Updates</h2>
  <p>We may deliver improvements and fixes to the app’s JavaScript layer without a new store
  release. Such updates do not change the purpose of the app. Larger changes are shipped
  through the App Store and Google Play in the normal way.</p>

  <h2 id="ip">6. Intellectual property</h2>
  <p>The Service, including its design, text, graphics and code, is owned by us and
  protected by intellectual property law. We grant you a personal, non-exclusive,
  non-transferable, revocable licence to use the app on devices you own or control, in
  accordance with these Terms and, on iOS, with Apple’s{' '}
  <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" rel="noopener noreferrer" target="_blank">Licensed
  Application End User License Agreement</a>, which applies in addition to these Terms.{' '}
  <strong>Your own content — your notes, reasons and entries — remains yours.</strong></p>

  <h2 id="no-warranty">7. Disclaimer of warranties</h2>
  <p>The Service is provided <strong>“as is” and “as available”</strong>, without warranties
  of any kind, express or implied, including merchantability, fitness for a particular
  purpose, accuracy, and non-infringement. We do not warrant that the Service will be
  uninterrupted, error-free, or effective for your situation. Some jurisdictions do not
  allow the exclusion of implied warranties, so parts of this section may not apply to you.</p>

  <h2 id="liability">8. Limitation of liability</h2>
  <p>To the maximum extent permitted by law, we will not be liable for indirect, incidental,
  special, consequential or punitive damages, or for lost profits, lost data, or any harm
  arising from your use of, or inability to use, the Service — including any relapse,
  health outcome, or decision made in reliance on it.</p>
  <p><strong>Data loss:</strong> Curb stores everything you write on your device only, and we
  cannot recover it for you. Deleting the app,
  losing or resetting the device, or a device fault will permanently destroy that data. We
  hold no backup and cannot restore it.</p>
  <p>Our total liability for any claim relating to the Service is limited to the greater of
  the amount you paid us in the twelve months before the claim, or USD 50. Nothing in these
  Terms excludes liability that cannot lawfully be excluded, including for death or personal
  injury caused by negligence, or for fraud.</p>

  <h2 id="termination">9. Termination</h2>
  <p>You may stop using Curb at any time by deleting it. We may suspend or terminate access
  if you breach these Terms or if we discontinue the Service. Sections 6 to 11 survive
  termination.</p>

  <h2 id="law">10. Governing law</h2>
  <p>These Terms are governed by the laws of India, without regard to conflict of
  law rules, and the courts of India have exclusive jurisdiction — except that
  consumers may bring proceedings in their country of residence, and mandatory local
  consumer protections continue to apply.</p>

  <h2 id="apple">11. Apple and Google</h2>
  <p>Apple and Google are not parties to these Terms and are not responsible for the
  Service. On iOS, Apple is a third-party beneficiary of these Terms and may enforce them.
  Any claim about the app’s failure to conform to a warranty is our responsibility, not
  Apple’s or Google’s.</p>

  <h2 id="changes">12. Changes and contact</h2>
  <p>We may update these Terms; the effective date above will change and material changes
  will be notified in the app. Questions:
  <a href="mailto:support@joincurb.app">support@joincurb.app</a>, Gyanendra Singh,
  110/05 Pinto Park, Delhi Cantt, New Delhi 110010, India.</p>
    </LegalPage>
  );
}
