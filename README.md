# Frame Supply — After Effects & Premiere Pro template marketplace

Next.js 16 (App Router) + SQLite (`node:sqlite`, Node 24+). Each template has its own price, with no subscription.

## Quick start

```bash
pnpm install
pnpm seed           # 24 demo projects with generated previews (needs ffmpeg + zip)
pnpm dev            # http://localhost:3000
```

`pnpm seed --reset` wipes products, orders and reviews, then reseeds. All data lives in `storage/` (git-ignored): `data.db`, public media in `storage/media`, and private project archives in `storage/files`.

In development, checkout completes instantly (demo mode). The sign-in link is shown on screen because no mail provider is configured. Any signed-in user can open `/admin`.

## Configuration (`.env.local`, see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Cookie signing secret. **Required in production.** |
| `APP_URL` | Public base URL, used for OAuth/Stripe/email links. |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in. Redirect URI: `${APP_URL}/api/auth/google/callback`. |
| `RESEND_API_KEY`, `MAIL_FROM` | Sends sign-in links and receipts. Without it, emails are printed to the server log. |
| `STRIPE_SECRET_KEY` | Real payments via Stripe Checkout. Without it, checkout runs in demo mode. |
| `DEMO_MODE=1` | Allows demo checkout and on-screen sign-in links in production (staging only). |
| `STORAGE_DIR` | Where the DB and files live (use a persistent volume in production). |

## How it works

- **Buying**: a buyer enters an email or continues with Google. The receipt email contains the download link and a sign-in link. Later, they sign in (email link or Google) and find every purchase in **Library** (`/account`), with download buttons and a one-line rating/review form.
- **Versions & licenses**: a project can be Ae, Pr or both. When both exist, the buyer ticks one or both versions, and both together cost the bundle price. The Standard license covers one end product; the Multi-use license costs ×2 (set in `src/lib/config.ts`).
- **Bundle discounts** (`src/lib/pricing.ts`, re-checked on the server at checkout): items are sorted by price. The 2nd item gets −15% and the 3rd and later get −20%, so discounts always land on the cheaper items.
- **Daily reviews** (`src/lib/reviews.ts`): a new project starts with 0 reviews. Every following day it gets 1–10 generated reviews, seeded by project and date, so the result is deterministic and missed days catch up. Reviews from verified buyers are stored separately and marked with a badge.
- **Admin** (`/admin`): create and edit projects with prices, sale %, featured slot (1–5), MotionBro / auto-resize flags, extra key features, "What's included" categories with scene images, preview poster/video, and project archives (upload or external URL).
