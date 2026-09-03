import { LegalPage, Callout } from '@/components/legal';

export const metadata = {
  title: 'Crisis & Support Lines',
  description: 'Free, confidential crisis and addiction support lines.',
};

export default function Page() {
  return (
    <LegalPage title={'If you need help right now'} updated={'Free, confidential, and available whether or not you use Curb.'}>
<Callout tone="danger">
    <p><strong>If you are in immediate danger or think you may harm yourself, call your local
    emergency number now</strong> — 911 in the US, 999 in the UK, 112 across the EU, 000 in
    Australia, 112 in India.</p>
  </Callout>

  <h2>United States</h2>
  <ul>
    <li><strong>988 Suicide &amp; Crisis Lifeline</strong> — call or text <strong>988</strong>, 24/7.{' '}
        <a href="https://988lifeline.org" rel="noopener noreferrer" target="_blank">988lifeline.org</a></li>
    <li><strong>SAMHSA National Helpline</strong> (substance use, treatment referral) —
        <strong>1-800-662-HELP (4357)</strong>, free and confidential, 24/7.{' '}
        <a href="https://www.samhsa.gov/find-help/national-helpline" rel="noopener noreferrer" target="_blank">samhsa.gov</a></li>
    <li><strong>Crisis Text Line</strong> — text <strong>HOME</strong> to <strong>741741</strong>.</li>
    <li><strong>National Problem Gambling Helpline</strong> — <strong>1-800-522-4700</strong>.</li>
  </ul>

  <h2>United Kingdom &amp; Ireland</h2>
  <ul>
    <li><strong>Samaritans</strong> — <strong>116 123</strong>, free, 24/7.{' '}
        <a href="https://www.samaritans.org" rel="noopener noreferrer" target="_blank">samaritans.org</a></li>
    <li><strong>FRANK</strong> (drugs) — <strong>0300 123 6600</strong>.{' '}
        <a href="https://www.talktofrank.com" rel="noopener noreferrer" target="_blank">talktofrank.com</a></li>
    <li><strong>Drinkline</strong> — <strong>0300 123 1110</strong>.</li>
    <li><strong>National Gambling Helpline</strong> — <strong>0808 8020 133</strong>.</li>
  </ul>

  <h2>Elsewhere</h2>
  <ul>
    <li><strong>Find a Helpline</strong> — verified crisis lines in over 130 countries.{' '}
        <a href="https://findahelpline.com" rel="noopener noreferrer" target="_blank">findahelpline.com</a></li>
    <li><strong>International Association for Suicide Prevention</strong> —
        <a href="https://www.iasp.info/crisis-centres-helplines/" rel="noopener noreferrer" target="_blank">crisis centre directory</a></li>
  </ul>

  <h2>Peer support</h2>
  <ul>
    <li>Alcoholics Anonymous — <a href="https://www.aa.org" rel="noopener noreferrer" target="_blank">aa.org</a></li>
    <li>Narcotics Anonymous — <a href="https://na.org" rel="noopener noreferrer" target="_blank">na.org</a></li>
    <li>SMART Recovery — <a href="https://smartrecovery.org" rel="noopener noreferrer" target="_blank">smartrecovery.org</a></li>
    <li>Gamblers Anonymous — <a href="https://www.gamblersanonymous.org" rel="noopener noreferrer" target="_blank">gamblersanonymous.org</a></li>
  </ul>

  <Callout>
    <p>Curb is a self-tracking tool, not a treatment service, and cannot respond to
    emergencies. Please use the lines above — they are staffed by people trained for this.</p>
  </Callout>
    </LegalPage>
  );
}
