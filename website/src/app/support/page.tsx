import Link from 'next/link';
import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Support',
  description: 'Get help with Curb: contact, FAQs, subscriptions, and managing your data.',
};

export default function Page() {
  return (
    <LegalPage title={'Support'} updated={'We answer every email, usually within two business days.'}>
<Callout>
    <p><strong>Email:</strong> <a href="mailto:support@joincurb.app">support@joincurb.app</a><br />
    <strong>Privacy questions:</strong> <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a></p>
    <p>Tell us your device and OS version and what you were doing — it gets you a real answer
    faster. Please don’t email personal recovery details; we don’t need them to help.</p>
  </Callout>

  <h2>Frequently asked</h2>

  <h3>Where is my data stored?</h3>
  <p>On your phone, in the app’s private storage — never on our servers, because we don’t
  have any that receive it. See the <Link href="/privacy">privacy policy</Link>.</p>

  <h3>I got a new phone. Can I move my data?</h3>
  <p>Not automatically yet. Before switching, open <em>Settings → Export everything</em> and
  save the JSON file somewhere safe. Cloud backup is on our roadmap.</p>

  <h3>I logged a slip by mistake.</h3>
  <p>Tap <strong>Undo</strong> on the banner at the top of the Home screen. It stays there
  for 24 hours after a slip is recorded and fully restores your streak.</p>

  <h3>How do I log that I slipped on only one habit?</h3>
  <p>Tap that habit’s chip under your streak on the Home screen. Only that habit’s counter
  restarts; the others keep counting.</p>

  <h3>Why did my streak reset?</h3>
  <p>Streaks only reset when you record a slip. Missing a pledge or a check-in, or not
  opening the app, never resets anything.</p>

  <h3>How do I cancel my subscription?</h3>
  <p><strong>iPhone/iPad:</strong> Settings → tap your name → Subscriptions → Curb → Cancel
  Subscription.<br />
  <strong>Android:</strong> Google Play → profile icon → Payments &amp; subscriptions →
  Subscriptions → Curb → Cancel.</p>
  <p>Cancel at least 24 hours before your renewal date to avoid the next charge. You keep
  access until the end of the period you’ve paid for.</p>

  <h3>How do I get a refund?</h3>
  <p>Refunds are handled by the store, not by us. On iOS use{' '}
  <a href="https://reportaproblem.apple.com" rel="noopener noreferrer" target="_blank">reportaproblem.apple.com</a>; on
  Android use Google Play’s refund request. If a store declines and you think there’s been a
  genuine error, email us and we’ll help where we can.</p>

  <h3>How do I restore a purchase on a new device?</h3>
  <p>Open the paywall and tap <strong>Restore purchases</strong>, signed in with the same
  Apple or Google account you bought with.</p>

  <h3>Reminders aren’t arriving.</h3>
  <p>Check that notifications are allowed for Curb in your device settings, and that
  reminders are switched on in <em>Curb → Settings → Reminders</em>. Focus modes and battery
  savers can also delay them.</p>

  <h3>How do I delete everything?</h3>
  <p><em>Settings → Delete everything</em>, or just delete the app. See{' '}
  <Link href="/delete-data">Delete my data</Link>.</p>

  <h3>Is Curb a substitute for treatment?</h3>
  <p>No. Curb is a self-tracking tool, not a medical device, and it doesn’t diagnose or treat
  anything. If you’re struggling, please talk to a professional — and see our{' '}
  <Link href="/crisis">crisis and support lines</Link>.</p>
    </LegalPage>
  );
}
