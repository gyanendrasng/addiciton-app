# joincurb.app

Next.js (App Router, Tailwind v4, TypeScript). Fully static — every route is
prerendered at build time.

```
website/
├── src/app/
│   ├── page.tsx              /              landing page
│   ├── privacy/page.tsx      /privacy       ← App Store Connect + Play Console privacy URL
│   ├── terms/page.tsx        /terms         ← App Store Connect EULA URL
│   ├── support/page.tsx      /support       ← App Store Connect support URL
│   ├── crisis/page.tsx       /crisis        crisis + treatment lines (linked from the app)
│   ├── delete-data/page.tsx  /delete-data   data deletion instructions
│   ├── layout.tsx            shell, fonts, metadata
│   ├── globals.css           design tokens (match the app's palette)
│   ├── robots.ts  sitemap.ts
├── src/components/           site-header, site-footer, legal
└── vercel.json               security headers
```

## Before going live — fill these in

Replace the bracketed placeholders everywhere they appear:

```bash
grep -rn "\[LEGAL ENTITY NAME\]\|\[REGISTERED ADDRESS\]\|\[JURISDICTION\]" src/
```

- `[LEGAL ENTITY NAME]` — the entity that owns the app
- `[REGISTERED ADDRESS]` — required by GDPR, expected by Google
- `[JURISDICTION]` — governing law in `/terms`

Then create the two mailboxes referenced throughout:
`support@joincurb.app` and `privacy@joincurb.app`.

Add `public/favicon.png` and `public/apple-touch-icon.png` once the logo exists.

## Develop

```bash
npm run dev     # http://localhost:3000
npm run build   # static export check
```

## Deploy to Vercel

```bash
npx vercel        # preview
npx vercel --prod # production
```

Or connect the GitHub repo in the Vercel dashboard and set **Root Directory** to
`website`. Then add `joincurb.app` under Project → Settings → Domains and point
the domain's nameservers (or an A/CNAME record) at Vercel. `.app` is on the HSTS
preload list, so HTTPS is mandatory — Vercel provisions the certificate
automatically.

## Store URLs these pages satisfy

| Field | URL |
|---|---|
| Privacy Policy (Apple + Google) | `https://joincurb.app/privacy` |
| EULA / Terms (Apple) | `https://joincurb.app/terms` |
| Support URL (Apple), contact (Google) | `https://joincurb.app/support` |
| Marketing URL (optional) | `https://joincurb.app` |
