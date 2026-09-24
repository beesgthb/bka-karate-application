# Bishal Karate Association

Real, deployable React + Supabase project (not a Claude.ai artifact — this
needs Node/npm since it talks to a real Supabase backend).

## Run locally
```bash
npm install
npm run dev
```

## Deploy (Vercel)
1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Set **Root Directory** to `bishal-karate` (Vercel auto-detects Vite, so
   build command `npm run build` and output `dist` are filled in for you).
4. Click **Deploy**.

No environment variables are needed — the Supabase URL/publishable key are
already in `src/supabaseClient.js` and are safe to be public. Every push to
`main` redeploys automatically.

## First login
- Admin: `bishalkarateassociation@gmail.com` (or mobile `6000259414`, or
  username `admin`) + your password + an email OTP.

See the top-level `INTEGRATION_GUIDE.md` (shared separately) for what's
already wired up and what's left to connect.
