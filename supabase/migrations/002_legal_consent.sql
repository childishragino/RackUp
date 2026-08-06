-- Migration 002 — record acceptance of the Terms of Service / Privacy Policy.
-- Run this in the Supabase SQL editor if you already ran schema.sql before the
-- legal documents were added. Fresh projects get these columns from schema.sql.
--
-- Purpose: a client-side checkbox proves nothing on its own. Recording the
-- version and timestamp server-side, on the row owned by the user, gives a
-- durable record of who accepted which revision and when.

alter table profiles add column if not exists terms_accepted_at timestamptz;
alter table profiles add column if not exists terms_version text;
