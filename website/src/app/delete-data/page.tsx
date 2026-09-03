import Link from 'next/link';
import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Delete My Data',
  description: 'How to permanently delete all of your Curb data.',
};

export default function Page() {
  return (
    <LegalPage title={'Delete my data'} updated={'Curb has no accounts, so deletion is immediate and entirely in your hands.'}>
<Callout>
    <p>Everything you record in Curb is stored only on your device. There is no account to
    close and no server-side copy for us to erase — deleting it on your phone deletes it
    everywhere.</p>
  </Callout>

  <h2>Option 1 — Delete from inside the app</h2>
  <ol>
    <li>Open Curb and go to the <strong>Settings</strong> tab.</li>
    <li>Scroll to <strong>Your data</strong>.</li>
    <li>Tap <strong>Delete everything</strong> and confirm twice.</li>
  </ol>
  <p>This permanently removes your streaks, slips, check-ins, urges, reasons, journal entries
  and preferences, and returns the app to its first-run state.</p>

  <h2>Option 2 — Delete the app</h2>
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
