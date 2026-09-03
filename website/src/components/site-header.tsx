import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-black/70 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 1024 1024" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="88" strokeLinecap="round">
              <path d="M 516.1 663 A 138 138 0 1 1 364 481.8" />
              <path d="M 507.9 361 A 138 138 0 1 1 660 542.2" />
            </svg>
          </span>
          Curb
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-[15px] font-medium text-dim">
          <Link href="/privacy" className="transition-colors hover:text-ink">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-ink">Terms</Link>
          <Link href="/support" className="transition-colors hover:text-ink">Support</Link>
        </nav>
      </div>
    </header>
  );
}
