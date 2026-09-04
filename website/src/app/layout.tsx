import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://joincurb.app'),
  title: {
    default: 'Curb — Quit any addiction',
    template: '%s — Curb',
  },
  description:
    'Curb is a recovery companion. Track a streak for every habit, ride out urges with a guided toolkit, and log slips without shame.',
  openGraph: {
    title: 'Curb — Quit any addiction',
    description:
      'A recovery companion. Streaks, an urge toolkit, and shame-free slip logging.',
    url: 'https://joincurb.app',
    siteName: 'Curb',
    type: 'website',
  },
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
};

export const viewport = { themeColor: '#000000' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="bg-bg text-ink">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
