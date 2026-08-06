# RackUp — Build Specification (Handoff to Claude Code)

RackUp is a cross-platform workout logger PWA (iPhone, Samsung/Android, tablet, laptop).
A fully working single-file React prototype exists (`workout-logger.jsx`) — port its UI,
logic, and design system as-is. This document covers what the prototype could not do:
real persistence, deployment, and Apple Watch heart-rate sync.

---

## 1. Stack

- **Frontend:** Vite + React PWA (`vite-plugin-pwa`: manifest, service worker, offline
  cache, Add-to-Home-Screen on iOS/Android).
- **Backend/DB:** Supabase (free tier) — Postgres + Auth + Row Level Security.
- **Serverless:** Vercel functions for the health-data ingestion endpoint.
- **Hosting:** Vercel (free tier), custom domain optional.

## 2. Port from the prototype (already implemented, keep behavior identical)

- Routines: name, exercises (name, template notes, muscles, default sets, rest seconds
  in 10s steps, superset group A–D with colour coding).
- Live sessions: editable workout name, elapsed timer, set rows (weight / reps / done),
  per-exercise LB⇄KG toggle that converts values (records compared in canonical lbs),
  ghost autofill of last session's sets (grey until edited or checked), add exercise /
  set mid-session, empty workouts.
- Session-specific notes: per exercise, saved only on that session; template notes from
  the routine re-appear fresh each time.
- Rest timer: starts on set completion, +10s / skip, chime at zero
  (upgrade: also fire a Web Push notification — see §5).
- PR detection: weight PR ("PR" gold badge) and rep record ("REP RECORD" teal badge),
  computed against all-time history at set-completion time; listed in summary.
- Auto muscle detection from exercise name (regex table in prototype) + category
  pictogram (barbell / dumbbell / machine / bodyweight / cardio / kettlebell / mat).
- Routine detail: line+dot chart tabs (Volume lb / Reps / Duration min) with
  3-month / year / all-time range selector.
- Summary: duration, total lbs moved, sets done, PRs, session notes, muscle groups
  ranked by volume.
- Design system: colours, Barlow Condensed / IBM Plex Mono type, component styles —
  copy from the prototype's Style block.

## 3. Database schema (Supabase)

```sql
create table profiles (
  id uuid primary key references auth.users,
  display_name text,
  unit_pref text default 'lbs'
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  exercises jsonb not null,   -- [{name, notes, muscles[], defaultSets, restSec, superset}]
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  entries jsonb not null,     -- [{name, notes, sessionNote, muscles[], unit, restSec,
                              --   superset, sets:[{weight, reps, done, badges[]}]}]
  total_volume_lbs numeric,
  total_reps int,
  prs jsonb default '[]',
  avg_hr int,                 -- filled by health import
  max_hr int,
  hr_series jsonb             -- [{t: iso, bpm}]
);

create table health_samples (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  kind text not null,         -- 'heart_rate' | 'steps' | 'distance_km' | 'active_kcal'
  ts timestamptz not null,
  value numeric not null,
  unique (user_id, kind, ts)
);
```

Enable RLS on all tables: `user_id = auth.uid()` for select/insert/update/delete.
Migrate the artifact's saved JSON (routines + sessions) via a one-time import screen
that accepts pasted JSON.

## 4. Heart-rate sync (post-workout merge) — user's chosen approach

**Source:** the *Health Auto Export* iOS app (App Store) reads Apple Health (which the
watch writes to automatically) and POSTs JSON to a URL on a schedule.

**Endpoint:** `POST /api/health-import`
- Auth: per-user secret token (generated in RackUp settings, stored hashed in Supabase);
  Health Auto Export sends it as a header.
- Accepts Health Auto Export's JSON format; upsert into `health_samples`
  (heart rate, steps, walking distance, active energy). Idempotent via the unique key.

**Merge job** (on ingest, or when a session summary is opened):
- For each session with `avg_hr IS NULL` and `ended_at NOT NULL`:
  pull heart-rate samples where `ts BETWEEN started_at AND ended_at`;
  if any, write `avg_hr`, `max_hr`, `hr_series` onto the session.
- Summary UI: show avg/max HR chips + a small HR sparkline; show
  "waiting for watch data…" if the session ended < 2h ago and no samples yet.

**Steps tracker (module 3 of the larger app):** same `health_samples` table already
holds steps / km / active kcal — a simple daily dashboard reads it. Build after HR
sync is verified.

## 5. Notifications (rest timer + future watch mirroring)

- Web Push via service worker (iOS 16.4+ supports push for installed PWAs; pushes
  mirror to a paired Apple Watch with haptics).
- Fire "Rest over — next: {exercise}" when a rest timer completes while the app is
  backgrounded. In-app chime stays for the foreground case.
- Native watchOS companion (tap "done" on the wrist, live HR) is a later phase; the
  schema above already supports it.

## 6. Deployment checklist

1. `npm create vite@latest rackup -- --template react` + port prototype; add
   `vite-plugin-pwa` (name "RackUp", theme `#17222B`, icons 192/512).
2. Create Supabase project → run schema → enable RLS → email/OTP auth.
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (functions only).
4. Implement `/api/health-import` as a Vercel function.
5. Deploy to Vercel; verify install-to-home-screen on iPhone + Samsung.
6. Install Health Auto Export on iPhone → automation: Heart Rate + Steps + Distance +
   Active Energy → POST to `https://<app>/api/health-import` with the token header,
   every 30 min.
7. Verification: log a real workout with the watch on → finish → confirm HR appears
   on the summary within ~30 min.

## 7. Known constraints (do not silently work around)

- No web access to HealthKit — the export bridge is the supported path.
- Samsung phone displays all data but contributes steps only via a separate
  Health Connect bridge (later phase).
- Apple Watch cannot run the PWA; push mirroring is the interim, native app the endgame.
