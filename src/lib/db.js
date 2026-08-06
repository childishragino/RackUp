import { supabase } from "./supabaseClient";
import { finalizeTotals } from "./workout";

/* ------------------------------------------------------------------ */
/*  Maps between the app's in-memory shape (camelCase, ms timestamps,  */
/*  derived byMuscle) and the normalized Supabase rows (snake_case,    */
/*  timestamptz, jsonb). Keeping this mapping in one place means       */
/*  RackUp.jsx never has to know the DB's column names.                */
/* ------------------------------------------------------------------ */

function rowToRoutine(row) {
  return { id: row.id, name: row.name, exercises: row.exercises || [] };
}

function routineToRow(routine, userId) {
  return {
    id: routine.id,
    user_id: userId,
    name: routine.name,
    exercises: routine.exercises,
    updated_at: new Date().toISOString(),
  };
}

function rowToSession(row) {
  const session = {
    id: row.id,
    name: row.name,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : undefined,
    entries: row.entries || [],
    prs: row.prs || [],
    avgHr: row.avg_hr ?? null,
    maxHr: row.max_hr ?? null,
    hrSeries: row.hr_series || null,
  };
  return finalizeTotals(session); // recomputes totalVolume/totalReps/byMuscle from entries — single source of truth
}

function sessionToRow(session, userId) {
  return {
    id: session.id,
    user_id: userId,
    name: session.name,
    started_at: new Date(session.startedAt).toISOString(),
    ended_at: session.endedAt ? new Date(session.endedAt).toISOString() : null,
    entries: session.entries,
    total_volume_lbs: session.totalVolume ?? 0,
    total_reps: session.totalReps ?? 0,
    prs: session.prs || [],
  };
}

/* ------------------------------- CRUD ------------------------------- */

export async function loadAll() {
  const [{ data: routineRows, error: rErr }, { data: sessionRows, error: sErr }] = await Promise.all([
    supabase.from("routines").select("*").order("created_at", { ascending: true }),
    supabase.from("sessions").select("*").order("started_at", { ascending: true }),
  ]);
  if (rErr) throw rErr;
  if (sErr) throw sErr;
  return {
    routines: (routineRows || []).map(rowToRoutine),
    sessions: (sessionRows || []).map(rowToSession),
  };
}

export async function saveRoutine(routine, userId) {
  const { data, error } = await supabase
    .from("routines")
    .upsert(routineToRow(routine, userId))
    .select()
    .single();
  if (error) throw error;
  return rowToRoutine(data);
}

export async function deleteRoutine(id) {
  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) throw error;
}

export async function insertSession(session, userId) {
  const finalized = finalizeTotals(session);
  const { data, error } = await supabase
    .from("sessions")
    .insert(sessionToRow(finalized, userId))
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data);
}

/** One-time import of the prototype's pasted localStorage/artifact JSON (`{routines, sessions}`). */
export async function importLegacyData({ routines = [], sessions = [] }, userId) {
  if (routines.length) {
    const { error } = await supabase.from("routines").upsert(routines.map((r) => routineToRow(r, userId)));
    if (error) throw error;
  }
  if (sessions.length) {
    const rows = sessions.map((s) => sessionToRow(finalizeTotals({ ...s }), userId));
    const { error } = await supabase.from("sessions").upsert(rows);
    if (error) throw error;
  }
  return loadAll();
}

/* --------------------------- health token ---------------------------- */

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Stamps the accepted legal version onto the user's profile. Called once after
 * sign-in; rewrites only when the stored version differs from the current one,
 * so the timestamp reflects when *this* revision was accepted.
 */
export async function recordConsent(userId, version) {
  const { data, error } = await supabase
    .from("profiles")
    .select("terms_version")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data && data.terms_version === version) return;
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString(), terms_version: version })
    .eq("id", userId);
  if (updErr) throw updErr;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Generates a fresh health-import token, stores only its hash, and returns the raw token (shown once). */
export async function regenerateHealthToken(userId) {
  const token = randomToken();
  const hash = await sha256Hex(token);
  const { error } = await supabase.from("profiles").update({ health_token_hash: hash }).eq("id", userId);
  if (error) throw error;
  return token;
}

/* ---------------------------- HR merge (client-side, on Summary open) ---------------------------- */

/**
 * If `session` has ended but has no avg_hr yet, pulls heart_rate samples in
 * [startedAt, endedAt] and writes avg/max/series onto the session row.
 * Mirrors the merge job that also runs server-side in /api/health-import
 * on every ingest — this covers the case where samples arrived before the
 * next scheduled export but the user opens the summary in between.
 */
export async function mergeHeartRateIfNeeded(session, userId) {
  if (!session.endedAt || session.avgHr != null) return session;
  const { data: samples, error } = await supabase
    .from("health_samples")
    .select("ts, value")
    .eq("user_id", userId)
    .eq("kind", "heart_rate")
    .gte("ts", new Date(session.startedAt).toISOString())
    .lte("ts", new Date(session.endedAt).toISOString())
    .order("ts", { ascending: true });
  if (error) throw error;
  if (!samples || samples.length === 0) return session;

  const values = samples.map((s) => Number(s.value));
  const avgHr = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const maxHr = Math.round(Math.max(...values));
  const hrSeries = samples.map((s) => ({ t: s.ts, bpm: Number(s.value) }));

  const { error: updErr } = await supabase
    .from("sessions")
    .update({ avg_hr: avgHr, max_hr: maxHr, hr_series: hrSeries })
    .eq("id", session.id);
  if (updErr) throw updErr;

  return { ...session, avgHr, maxHr, hrSeries };
}
