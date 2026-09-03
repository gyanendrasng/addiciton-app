/**
 * Transactional email.
 *
 * Only one message is ever sent: the six-digit sign-in code. Resend's REST API
 * is called directly rather than through their SDK — one fetch, no dependency,
 * and it works unchanged on Vercel's Node runtime.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Verified sender on the joincurb.app domain. */
const FROM = process.env.MAIL_FROM ?? 'Curb <hello@joincurb.app>';

async function send(to: string, subject: string, text: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // In development, printing the code beats configuring a mail provider.
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mail] to=${to} subject=${subject}\n${text}`);
      return;
    }
    throw new Error('RESEND_API_KEY is not set');
  }
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

/**
 * The sign-in code.
 *
 * Deliberately says nothing about what Curb is for. These emails land in
 * inboxes that other people sometimes see, and "your addiction recovery app"
 * on a lock screen is a reason not to use the app.
 */
export async function sendSignInCode(to: string, code: string) {
  const subject = `${code} is your Curb code`;
  const text = [
    `Your Curb sign-in code is ${code}.`,
    '',
    'It expires in 5 minutes and can be used once.',
    'If you did not request it, you can ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#111">
      <p style="font-size:15px;color:#555;margin:0 0 24px">Your Curb sign-in code:</p>
      <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:0 0 24px">${code}</p>
      <p style="font-size:14px;color:#555;line-height:1.5;margin:0">
        It expires in 5 minutes and can be used once.<br />
        If you didn’t request it, you can ignore this email.
      </p>
    </div>`;
  await send(to, subject, text, html);
}
