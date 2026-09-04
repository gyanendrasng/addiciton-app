import Link from 'next/link';
import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Delete My Data',
  description: 'How to permanently delete all of your Curb data.',
};

export default function Page() {
  return (
    <LegalPage title={'Delete my data'} updated={'Two places to delete from: your phone, and our servers.'}>
<Callout>
    <p>There are two places to delete from: the copy on your phone, and your account on
    our servers. Each is a couple of taps, and both are below. If you also turned on
    analytics, there is a third step — see <a href="#usage">usage data</a>.</p>
  </Callout>

  <h2>Option 1 — Delete from inside the app</h2>
  <ol>
    <li>Open Curb and go to the <strong>Settings</strong> tab.</li>
    <li>Scroll to <strong>Your data</strong>.</li>
    <li>Tap <strong>Delete everything</strong> and confirm twice.</li>
  </ol>
  <p>This permanently removes your streaks, slips, check-ins, urges, reasons, journal entries
  and preferences, and returns the app to its first-run state.</p>

  <h2>Option 2 — Delete your account</h2>
  <p>This removes your email address, sign-in records and subscription record from our
  servers, and your usage data along with them.</p>
  <ol>
    <li>Open Curb and go to the <strong>Settings</strong> tab.</li>
    <li>Tap <strong>Manage account</strong>, then <strong>Delete account</strong>.</li>
    <li>Confirm twice.</li>
  </ol>
  <p>Deleting your account does not cancel billing — cancel that in your Apple or Google
  subscription settings — and does not touch the data on your phone.</p>
  <p>No longer have the app installed? Email{' '}
  <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a> from the address you
  signed in with and we will delete the account for you.</p>

  <h2 id="usage">Option 3 — Delete your usage data</h2>
  <p>If you turned on <em>Share usage data</em>, Curb has sent product analytics to PostHog:
  which screens you opened, which habits you track, how long your streaks ran. Deleting your
  account does not automatically delete that, because it is stored separately.</p>
  <ol>
    <li>Turn it off in <strong>Settings → Your data → Share usage data</strong>. Collection
    stops immediately.</li>
    <li>Email <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a> to have what was
    already collected deleted. Do this <em>before</em> deleting your account if you can, so we
    can still match your request to your records.</li>
  </ol>
  <p>Anything not deleted on request is removed automatically 12 months after collection.</p>

  <h2>Option 4 — Delete the app</h2>
  <p>Uninstalling Curb removes its private storage, and with it all of your data.</p>
  <ul>
    <li><strong>iOS:</strong> press and hold the Curb icon → Remove App → Delete App.</li>
    <li><strong>Android:</strong> press and hold the Curb icon → App info → Uninstall.</li>
  </ul>

  <Callout tone="warn">
    <p><strong>Save a copy first if you might want it.</strong> Deletion is permanent and we
    cannot recover your history. Use <em>Settings → Export everything</em> to keep a JSON
    file before you delete.</p>
  </Callout>

  <h2>What deleting does not remove</h2>
  <ul>
    <li><strong>Your subscription.</strong> Deleting the app does not cancel billing — cancel
        it in your Apple or Google account settings. See <Link href="/support">Support</Link>.</li>
    <li><strong>Purchase records</strong> held by Apple, Google and RevenueCat, which are
        kept under their own policies and applicable tax law.</li>
    <li><strong>Files you exported yourself</strong> and saved elsewhere.</li>
  </ul>

  <h2>Need help?</h2>
  <p>Email <a href="mailto:privacy@joincurb.app">privacy@joincurb.app</a> and we’ll walk you
  through it, or action any request we’re able to.</p>
    </LegalPage>
  );
}
