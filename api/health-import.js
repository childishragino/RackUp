import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// Server-only client — bypasses RLS via the service-role key, because this
// endpoint authenticates via a per-user token header (Health Auto Export
// can't hold a Supabase session), not a Supabase auth JWT.
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TOKEN_HEADER = "x-rackup-token";

// Health Auto Export metric names vary by export format/version; map the
// ones we care about (RACKUP-BUILD-SPEC.md §4) onto our `kind` enum.
const METRIC_KIND = {
  heart_rate: "heart_rate",
  step_count: "steps",
  steps: "steps",
  walking_running_distance: "distance_km",
  active_energy: "active_kcal",
};

function sha256Hex(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function toIso(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function sampleValue(point) {
  // Most metrics use `qty`; some (e.g. heart rate summarized per interval) use Avg/Min/Max.
  if (point.qty != null) return Number(point.qty);
  if (point.Avg != null) return Number(point.Avg);
  if (point.value != null) return Number(point.value);
  return null;
}

async function upsertSamples(userId, metrics) {
  const rows = [];
  for (const metric of metrics || []) {
    const kind = METRIC_KIND[metric.name];
    if (!kind) continue;
    for (const point of metric.data || []) {
      const ts = toIso(point.date || point.Date);
      const value = sampleValue(point);
      if (!ts || value == null || isNaN(value)) continue;
      rows.push({ user_id: userId, kind, ts, value });
    }
  }
  if (rows.length === 0) return 0;

  // Idempotent: unique(user_id, kind, ts) means a re-delivered export is a no-op.
  const { error } = await supabase.from("health_samples").upsert(rows, { onConflict: "user_id,kind,ts", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

/** Fills avg_hr/max_hr/hr_series for recently-ended sessions that don't have it yet. */
async function mergeHeartRate(userId) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .eq("user_id", userId)
    .is("avg_hr", null)
    .not("ended_at", "is", null)
    .gte("ended_at", since);
  if (error) throw error;
  if (!sessions || sessions.length === 0) return 0;

  let merged = 0;
  for (const session of sessions) {
    const { data: samples, error: sErr } = await supabase
      .from("health_samples")
      .select("ts, value")
      .eq("user_id", userId)
      .eq("kind", "heart_rate")
      .gte("ts", session.started_at)
      .lte("ts", session.ended_at)
      .order("ts", { ascending: true });
    if (sErr) throw sErr;
    if (!samples || samples.length === 0) continue;

    const values = samples.map((s) => Number(s.value));
    const avgHr = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const maxHr = Math.round(Math.max(...values));
    const hrSeries = samples.map((s) => ({ t: s.ts, bpm: Number(s.value) }));

    const { error: updErr } = await supabase
      .from("sessions")
      .update({ avg_hr: avgHr, max_hr: maxHr, hr_series: hrSeries })
      .eq("id", session.id);
    if (updErr) throw updErr;
    merged++;
  }
  return merged;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = req.headers[TOKEN_HEADER];
  if (!token) {
    res.status(401).json({ error: `Missing ${TOKEN_HEADER} header` });
    return;
  }

  const tokenHash = sha256Hex(token);
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("health_token_hash", tokenHash)
    .maybeSingle();
  if (profErr) {
    res.status(500).json({ error: profErr.message });
    return;
  }
  if (!profile) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const metrics = body?.data?.metrics || body?.metrics || [];
    const inserted = await upsertSamples(profile.id, metrics);
    const merged = await mergeHeartRate(profile.id);
    res.status(200).json({ ok: true, inserted, merged });
  } catch (e) {
    res.status(500).json({ error: e.message || "Import failed" });
  }
}
