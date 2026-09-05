# Bishal Karate Association

Real, deployable React + Supabase project (not a Claude.ai artifact — this
needs Node/npm since it talks to a real Supabase backend).

## Run locally
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run build
```
Then deploy the `dist/` folder to Vercel/Netlify, or connect this repo
directly on vercel.com (no environment variables needed — the Supabase
URL/publishable key are already in `src/supabaseClient.js` and are safe
to be public).

## First login
- Admin: `bishalkarateassociation@gmail.com` (or mobile `6000259414`, or
  username `admin`) + your password + an email OTP.

See the top-level `INTEGRATION_GUIDE.md` (shared separately) for what's
already wired up and what's left to connect.
