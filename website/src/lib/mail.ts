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
 * The sign-in code email.
 *
 * Exported separately from sending so it can be rendered and looked at
 * without a mail provider — a template nobody has seen is a template nobody
 * has checked.
 *
 * Written to the constraints email actually has, which are not the web's:
 *
 * - **Tables, not flexbox.** Outlook renders with Word's engine; grid, flex
 *   and modern CSS silently collapse.
 * - **Every style inline.** Gmail strips <style> blocks in some clients.
 * - **No images.** A logo would need a hosted PNG (Gmail blocks SVG), images
 *   are off by default in many clients, and a broken box is worse than none.
 *   The wordmark is text.
 * - **Explicit colours on every element**, including the background, so dark
 *   mode inversion can't leave dark text on a dark card.
 * - **The code is selectable text**, never an image, so it can be copied — and
 *   it's in the subject line too, which is what lets people read it from the
 *   notification without opening anything.
 *
 * And it says nothing about what Curb is for. These land in inboxes other
 * people sometimes see; "your addiction recovery app" on a lock screen is a
 * reason to delete the app.
 */
export function signInCodeEmail(code: string) {
  const subject = `${code} is your Curb code`;

  const text = [
    `Your Curb sign-in code is ${code}.`,
    '',
    'It expires in 5 minutes and can be used once.',
    'If you did not request it, you can ignore this email.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <!-- Without this, clients fall back to Latin-1 and every em-dash and
         curly quote arrives as mojibake. Found by rendering the template
         rather than trusting it. -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Your Curb sign-in code</title>
  </head>
  <body style="margin:0;padding:0;background:#F1F3F4;">
    <!-- Preheader: what shows next to the subject in the inbox list. -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your code expires in 5 minutes.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#F1F3F4;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="max-width:440px;background:#FFFFFF;border-radius:20px;
                        border:1px solid #DDE1E4;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                            font-size:15px;font-weight:700;letter-spacing:-0.2px;color:#111519;">
                  Curb
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                            font-size:22px;line-height:28px;font-weight:700;letter-spacing:-0.4px;color:#111519;">
                  Here’s your sign-in code
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="background:#F1F3F4;border-radius:14px;">
                  <tr>
                    <td align="center" style="padding:20px 16px;">
                      <span style="font-family:'SF Mono',SFMono-Regular,Menlo,Consolas,monospace;
                                   font-size:34px;line-height:40px;font-weight:700;
                                   letter-spacing:10px;color:#111519;">${code}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                            font-size:14px;line-height:21px;color:#4E5A56;">
                  It expires in 5 minutes and can be used once.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;">
                <div style="border-top:1px solid #DDE1E4;padding-top:20px;
                            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                            font-size:13px;line-height:19px;color:#606D66;">
                  Didn’t ask for this? You can ignore it — nobody can sign in
                  without the code above.
                </div>
              </td>
            </tr>
          </table>
          <div style="max-width:440px;padding:20px 8px 0 8px;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:12px;line-height:18px;color:#606D66;text-align:center;">
            Sent by Curb because someone entered this address to sign in.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendSignInCode(to: string, code: string) {
  const { subject, text, html } = signInCodeEmail(code);
  await send(to, subject, text, html);
}
