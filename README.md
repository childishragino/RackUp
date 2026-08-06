# RackUp

Workout tracker and logger: custom routines, notes per exercise, set rows with
weight/reps/done checkboxes, session timing, PR detection ("PR" when weight exceeds your
historical max for that exercise, "REP RECORD" for reps), and a post-session summary of
total volume and muscle groups worked, ranked by usage.

Cross-platform PWA — routines, live sessions with rest timers and PR detection, progress
charts, and Apple Watch heart-rate sync via Health Auto Export.

Built per [RACKUP-BUILD-SPEC.md](RACKUP-BUILD-SPEC.md); UI ported from the
`workout-logger.jsx` prototype.

## Stack

- Vite + React PWA (`vite-plugin-pwa`) — installable on iPhone/Android
- Supabase — Postgres + email/OTP auth + Row Level Security
- Vercel — hosting + `/api/health-import` serverless function

## Local setup

1. Install [Node.js LTS](https://nodejs.org) (verify: `node -v` shows v20+).
2. `npm install`
3. Create a Supabase project (below), then `cp .env.example .env` and fill in the values.
4. `npm run dev` → http://localhost:5173

## Supabase setup

1. Sign up at https://supabase.com (free tier) and create a project (any region near you;
   note the database password somewhere safe — you rarely need it again).
2. In the dashboard: **SQL Editor → New query** → paste all of
   [`supabase/schema.sql`](supabase/schema.sql) → Run. This creates the tables, RLS
   policies, and the auto-profile trigger.
3. **Authentication → Providers → Email**: keep Email enabled. RackUp signs in with the
   6-digit OTP code from the magic-link email — in **Authentication → Email Templates →
   Magic Link**, make sure the template includes `{{ .Token }}` so the code appears in
   the email (default template does).
4. **Project Settings → API**: copy
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose in the client)

## Deploy to Vercel

1. Sign up at https://vercel.com (free Hobby tier; sign-in with GitHub is easiest).
2. Push this folder to a GitHub repo, then in Vercel: **Add New → Project → Import** the
   repo. Framework preset auto-detects Vite; the `api/` folder becomes a serverless
   function automatically.
3. Under **Environment Variables**, add all three values from `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy. Your app is at `https://<project>.vercel.app`.
5. On iPhone Safari / Android Chrome: open the URL → Share → **Add to Home Screen**.

## Heart-rate sync (Apple Watch)

1. In RackUp: **Settings → Heart-rate sync → Generate token**. Copy the token
   (shown once) and the webhook URL.
2. Install **Health Auto Export** (App Store) on the iPhone paired with the watch.
3. Create an automation: metrics **Heart Rate, Steps, Walking+Running Distance,
   Active Energy** → REST API export → URL `https://<app>.vercel.app/api/health-import`
   → add header `X-RackUp-Token: <your token>` → schedule every 30 min.
4. Verify: log a workout with the watch on, finish it, and the summary should show
   avg/max HR + a sparkline within ~30 min ("waiting for watch data…" until then).

## Import data from the prototype

**Settings → Import old data** — paste the JSON saved under the old artifact's
localStorage key `rackup:data` (or legacy `ironlog:data`).

## Project layout

```
api/health-import.js     Vercel function: token-auth ingest + HR merge job
supabase/schema.sql      tables, RLS policies, profile trigger
src/lib/workout.js       pure domain logic (detection, totals, records, formats)
src/lib/supabaseClient.js
src/lib/auth.jsx         email/OTP auth context
src/lib/db.js            CRUD mapping app shape <-> DB rows, token gen, HR merge
src/RackUp.jsx           main app (ported prototype)
src/components/          Style, Login, Settings, Import
```

## Known constraints (from the spec)

- No web access to HealthKit — Health Auto Export is the supported bridge.
- Samsung contributes steps only via a separate Health Connect bridge (later phase).
- Apple Watch can't run the PWA; Web Push mirroring is the interim path, native watchOS
  app the endgame.
