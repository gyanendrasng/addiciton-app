import Link from 'next/link';

const features = [
  {
    icon: '◐',
    color: '#FF8A4C',
    wash: 'rgba(255,138,76,.16)',
    title: 'The urge toolkit',
    body: 'Box breathing, a two-minute delay timer, your own written reasons, and a distraction game — in sequence, one tap from the home screen.',
  },
  {
    icon: '✋',
    color: '#3FDE9C',
    wash: 'rgba(63,222,156,.16)',
    title: 'A streak per habit',
    body: "Quitting more than one thing? Each habit has its own counter. Slipping on one doesn't erase the others.",
  },
  {
    icon: '☺',
    color: '#5EA8FF',
    wash: 'rgba(94,168,255,.16)',
    title: 'Slips without shame',
    body: 'Log what happened, name the trigger, pick three next actions. Your total clean days never reset — and you can undo a slip for 24 hours.',
  },
  {
    icon: '▦',
    color: '#B48CFF',
    wash: 'rgba(180,140,255,.16)',
    title: 'Progress you can read',
    body: 'A month calendar, a 90-day grid, longest streak, urges survived, and how your mood tracks against it all.',
  },
  {
    icon: '♥',
    color: '#F5D04B',
    wash: 'rgba(245,208,75,.16)',
    title: 'Your reasons, in your words',
    body: "Written when you're clear-headed, shown back to you when you're not.",
  },
  {
    icon: '◆',
    color: '#3FDE9C',
    wash: 'rgba(63,222,156,.16)',
    title: 'Milestones worth reaching',
    body: 'Ten tiers from Spark to Free. A slip restarts the climb — never the map.',
  },
];

const privacyPoints = [
  ['No account.', 'Nothing to sign up for, no email, no password.'],
  ['No servers.', "Your entries are never uploaded, because there's nowhere to upload them to."],
  ['No analytics, no ads, no trackers.', 'Not a single third-party tracking SDK.'],
  ['No selling or sharing.', 'Ever — and we have nothing to sell.'],
  ['Export or erase anytime.', 'Take your data as a file, or wipe it from Settings.'],
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 sm:pt-24">
        <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
          Coming soon to iOS &amp; Android
        </p>
        <h1 className="text-[clamp(44px,8vw,76px)] font-extrabold">
          Curb the urge.
          <br />
          Keep the streak.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-dim sm:text-xl">
          A recovery companion for whatever has a hold on you — porn, alcohol, smoking, vaping,
          weed, social media, gambling. One app, one streak per habit, and a toolkit for the
          moment it actually gets hard.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/support"
            className="inline-flex items-center rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-ink transition hover:brightness-110"
          >
            Get notified at launch
          </Link>
          <span className="text-sm text-faint">Private by design · No account required</span>
        </div>
      </section>

      <section id="how" className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-[clamp(30px,4.4vw,42px)] font-extrabold">
            Built for the hard moment, not the easy one.
          </h2>
          <p className="mt-4 max-w-2xl text-dim">
            Most trackers count days. Curb is designed around the two minutes when a craving peaks
            — and around what happens after a slip.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-3xl bg-surface p-6">
                <div
                  className="mb-4 grid h-10 w-10 place-items-center rounded-xl text-lg"
                  style={{ background: f.wash, color: f.color }}
                  aria-hidden
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
                <p className="text-[15.5px] leading-relaxed text-dim">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-accent-deep bg-accent/[0.08] p-8 sm:p-10">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">
              Why Curb is different
            </p>
            <h2 className="text-[clamp(26px,3.6vw,36px)] font-extrabold">
              Your recovery data never leaves your phone.
            </h2>
            <p className="mt-4 max-w-2xl text-dim">
              What you&apos;re quitting, every slip, every mood check-in, every journal note — all
              of it is stored in a database on your device and nowhere else.
            </p>
            <ul className="mt-6 space-y-2.5 text-dim">
              {privacyPoints.map(([bold, rest]) => (
                <li key={bold} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>
                    <strong className="font-semibold text-ink">{bold}</strong> {rest}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-faint">
              Full detail — including the few things that <em>do</em> use the network, like
              purchases and app updates — is in the{' '}
              <Link href="/privacy" className="text-accent hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(30px,4.4vw,42px)] font-extrabold">
              Curb is a self-tracking tool, not treatment.
            </h2>
            <p className="mt-4 text-dim">
              Curb is not a medical device and does not diagnose, treat, cure, or prevent any
              medical condition. It is not a substitute for professional medical advice, diagnosis,
              or treatment.
            </p>
            <p className="mt-4 text-dim">
              Stopping some substances abruptly — alcohol and benzodiazepines in particular — can be
              medically dangerous. Talk to a qualified healthcare professional before you change how
              you use them.
            </p>
            <Link
              href="/crisis"
              className="mt-8 inline-flex items-center rounded-full border border-line bg-surface2 px-6 py-3.5 font-semibold text-ink transition hover:bg-surface3"
            >
              Crisis &amp; support lines
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
