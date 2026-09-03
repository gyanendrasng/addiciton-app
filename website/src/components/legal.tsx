export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-14">
      <div className="prose-legal">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-3.5 text-sm text-faint">{updated}</p>
        {children}
      </div>
    </main>
  );
}

export function Callout({
  tone = 'accent',
  children,
}: {
  tone?: 'accent' | 'warn' | 'danger';
  children: React.ReactNode;
}) {
  const border =
    tone === 'warn' ? 'border-l-urge' : tone === 'danger' ? 'border-l-danger' : 'border-l-accent';
  return (
    <div className={`my-6 rounded-r-2xl border-l-[3px] bg-surface px-6 py-5 ${border} [&>p:last-child]:mb-0`}>
      {children}
    </div>
  );
}
