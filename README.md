# Aetheris Capital — Global Reach Hub

Institutional digital-asset yield platform for clients and the global desk. The hub covers portfolio views, plan selection, deposit wallets with signed proofs, referrals, and support escalation, backed by Supabase Auth and Edge Functions.

## Development

Requires Node.js 22+ and npm.

```sh
git clone https://github.com/giftikoleji-droid/global-reach-v2.git
cd global-reach-v2
cp .env.example .env   # fill in values below
npm install
npm run dev
```

## Environment variables

| Variable                        | Where used     | Description                                                                   |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Browser / Vite | Supabase project URL                                                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser / Vite | Supabase anon / publishable key                                               |
| `VITE_PUBLIC_APP_URL`           | Browser        | Public app origin for referral links (falls back to `window.location.origin`) |
| `PUBLIC_APP_URL`                | Edge Functions | Public app origin for support dashboard links                                 |
| `COMPANY_INBOX`                 | Edge Functions | Support ticket destination inbox                                              |
| `SUPPORT_FROM_EMAIL`            | Edge Functions | Verified Resend sender address                                                |
| `RESEND_API_KEY`                | Edge Functions | Resend API key for outbound mail                                              |
| `SUPABASE_URL`                  | Edge Functions | Supabase URL (server)                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Edge Functions | Service role key (server only)                                                |
| `BTC_API_URL`                   | Edge Functions | Bitcoin verification API base                                                 |
| `ETH_RPC_URL`                   | Edge Functions | Ethereum RPC endpoint                                                         |
| `TRON_API_URL`                  | Edge Functions | Tron API base                                                                 |
| `TRONGRID_API_KEY`              | Edge Functions | Trongrid API key                                                              |
| `PRICE_API_URL`                 | Edge Functions | Price feed API base                                                           |

Copy `.env.example` and set the values for local development. Production secrets belong in Vercel / Supabase project settings, not in git.

## Deployment

- **Frontend:** deploy with [Vercel](https://vercel.com) (or any Vite-compatible host). Set all `VITE_*` variables in the project environment.
- **Backend:** Supabase project for Auth, Postgres, and Edge Functions (`supabase/functions/*`). Set function secrets (`PUBLIC_APP_URL`, `RESEND_API_KEY`, chain APIs, etc.) in the Supabase dashboard.
- Point `VITE_PUBLIC_APP_URL` / `PUBLIC_APP_URL` at the production origin (no trailing slash).

## Quality checks

```sh
npm run check:ci   # lint + TypeScript + production build
npm test           # unit tests (aetheris helpers)
```

## Toolchain notes

- **Lockfiles:** `package-lock.json` is the source of truth for CI (`npm ci`). `bun.lock` may also be present for local Bun users.
- **rolldown override:** `package.json` pins `rolldown` to `1.2.1` via `overrides` to keep Vite’s native bundler on a known-good release and avoid peer/`@emnapi` resolution churn in CI and local installs.
- **Route tree:** `src/routeTree.gen.ts` is generated from `src/routes/`. Regenerate with the TanStack router generator after adding or renaming routes.
