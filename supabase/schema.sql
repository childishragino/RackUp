-- RackUp — Supabase schema.
-- Run this once in the Supabase SQL editor for a fresh project (Settings > SQL Editor > New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE where possible.

create extension if not exists pgcrypto; -- gen_random_uuid()

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  unit_pref text default 'lbs',
  -- sha-256 hex digest of the per-user Health Auto Export token (RACKUP-BUILD-SPEC.md §4).
  -- Never store the raw token — only its hash, so a leaked DB row can't be replayed as a header.
  health_token_hash text unique,
  created_at timestamptz default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  exercises jsonb not null,   -- [{id, name, notes, muscles[], defaultSets, restSec, superset}]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sessions (
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
  avg_hr int,                 -- filled by health import merge job
  max_hr int,
  hr_series jsonb             -- [{t: iso, bpm}]
);

create table if not exists health_samples (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  kind text not null,         -- 'heart_rate' | 'steps' | 'distance_km' | 'active_kcal'
  ts timestamptz not null,
  value numeric not null,
  unique (user_id, kind, ts)
);

create index if not exists routines_user_idx on routines (user_id);
create index if not exists sessions_user_started_idx on sessions (user_id, started_at desc);
create index if not exists health_samples_user_kind_ts_idx on health_samples (user_id, kind, ts);

-- ---------------------------------------------------------------------
-- Row Level Security: every table is scoped to the authenticated owner.
-- The /api/health-import Vercel function uses the service-role key and
-- bypasses RLS entirely (it authenticates via the per-user token header
-- instead of a Supabase session), so these policies only govern access
-- from the browser client (anon key + user JWT).
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table routines enable row level security;
alter table sessions enable row level security;
alter table health_samples enable row level security;

drop policy if exists "profiles: owner rw" on profiles;
create policy "profiles: owner rw" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "routines: owner rw" on routines;
create policy "routines: owner rw" on routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions: owner rw" on sessions;
create policy "sessions: owner rw" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "health_samples: owner rw" on health_samples;
create policy "health_samples: owner rw" on health_samples
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile row the first time a user signs in.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
