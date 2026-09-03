import Link from 'next/link';

const links = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/support', label: 'Support' },
  { href: '/crisis', label: 'Crisis Lines' },
  { href: '/delete-data', label: 'Delete My Data' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-12 text-[14.5px] text-faint">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap justify-between gap-10">
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
              <svg viewBox="0 0 1024 1024" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="88" strokeLinecap="round">
                <path d="M 516.1 663 A 138 138 0 1 1 364 481.8" />
                <path d="M 507.9 361 A 138 138 0 1 1 660 542.2" />
              </svg>
            </span>
            Curb
          </Link>
          <nav className="flex flex-wrap gap-5">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-dim transition-colors hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 max-w-3xl leading-relaxed">
          © {new Date().getFullYear()} Curb. Rated 16+/18+ — Curb references alcohol, tobacco and
          other substances for the purpose of helping people reduce or stop using them. Apple and the
          Apple logo are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks
          of Google LLC.
        </p>
      </div>
    </footer>
  );
}
