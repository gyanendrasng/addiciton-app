/**
 * Crisis and support lines, carried in the app rather than behind a link.
 *
 * Two reasons this is offline data and not a webview:
 *
 * 1. Someone reaching for it may have no signal, or may be in no state to wait
 *    for a page to load. A phone number that needs the internet to appear is
 *    the wrong design for the one screen that might matter most.
 * 2. App reviewers look for exactly this in recovery apps, and a link off to a
 *    website doesn't always count.
 *
 * Kept short on purpose. A wall of numbers is not usable in a crisis — a few
 * verified lines plus a directory that covers everywhere else is.
 */
export type Line = {
  name: string;
  /** what to show; also what gets dialled, minus formatting */
  contact: string;
  /** dial, text, or open a URL */
  action: 'call' | 'text' | 'link';
  href: string;
  note?: string;
};

export type Region = { id: string; label: string; lines: Line[] };

export const REGIONS: Region[] = [
  {
    id: 'us',
    label: 'United States & Canada',
    lines: [
      {
        name: '988 Suicide & Crisis Lifeline',
        contact: '988',
        action: 'call',
        href: 'tel:988',
        note: 'Call or text, 24/7',
      },
      {
        name: 'SAMHSA National Helpline',
        contact: '1-800-662-4357',
        action: 'call',
        href: 'tel:18006624357',
        note: 'Substance use and treatment referral, free, 24/7',
      },
      {
        name: 'Crisis Text Line',
        contact: 'Text HOME to 741741',
        action: 'text',
        href: 'sms:741741&body=HOME',
      },
      {
        name: 'National Problem Gambling Helpline',
        contact: '1-800-522-4700',
        action: 'call',
        href: 'tel:18005224700',
      },
    ],
  },
  {
    id: 'uk',
    label: 'United Kingdom & Ireland',
    lines: [
      { name: 'Samaritans', contact: '116 123', action: 'call', href: 'tel:116123', note: 'Free, 24/7' },
      { name: 'FRANK (drugs)', contact: '0300 123 6600', action: 'call', href: 'tel:03001236600' },
      { name: 'Drinkline', contact: '0300 123 1110', action: 'call', href: 'tel:03001231110' },
      {
        name: 'National Gambling Helpline',
        contact: '0808 8020 133',
        action: 'call',
        href: 'tel:08088020133',
      },
    ],
  },
  {
    id: 'other',
    label: 'Everywhere else',
    lines: [
      {
        name: 'Find a Helpline',
        contact: 'findahelpline.com',
        action: 'link',
        href: 'https://findahelpline.com',
        note: 'Verified crisis lines in over 130 countries',
      },
      {
        name: 'Alcoholics Anonymous',
        contact: 'aa.org',
        action: 'link',
        href: 'https://www.aa.org',
      },
      {
        name: 'SMART Recovery',
        contact: 'smartrecovery.org',
        action: 'link',
        href: 'https://smartrecovery.org',
      },
    ],
  },
];

/**
 * The medical disclaimer.
 *
 * The alcohol and benzodiazepine sentence is not boilerplate: unsupervised
 * withdrawal from either can cause seizures and can kill. An app that
 * encourages people to stop, and counts the days, has an obligation to say so
 * where they'll see it.
 */
export const DISCLAIMER =
  'Curb is a self-tracking tool, not treatment and not medical advice. If you are ' +
  'physically dependent on alcohol or benzodiazepines, stopping suddenly can be ' +
  'dangerous — talk to a doctor about how to withdraw safely.';

export const EMERGENCY =
  'If you are in immediate danger, call your local emergency number — 911 in the US, ' +
  '999 in the UK, 112 across the EU and India, 000 in Australia.';
