/* ------------------------------------------------------------------ */
/*  Pure workout-domain logic, shared by the UI (RackUp.jsx) and the   */
/*  Supabase data layer (db.js) so totals/records stay consistent      */
/*  whether they're computed client-side or during import/merge.       */
/* ------------------------------------------------------------------ */

export const LB_PER_KG = 2.20462;

export const MUSCLES = [
  "Glutes", "Hamstrings", "Quads", "Calves",
  "Back", "Chest", "Shoulders", "Biceps", "Triceps", "Core",
];

export const SUPERSETS = {
  A: { color: "#7C5CBF", bg: "#EFEAF8" },
  B: { color: "#2478B8", bg: "#E6F1F9" },
  C: { color: "#2E8B57", bg: "#E7F4ED" },
  D: { color: "#C2478D", bg: "#F9E9F2" },
};

/**
 * Ids are generated client-side so the UI can render a new routine/session
 * before the round-trip completes. They land in Postgres `uuid` columns, so
 * this must produce a real UUID — a short random string is rejected outright
 * with "invalid input syntax for type uuid".
 */
export const uid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for browsers without randomUUID (Safari < 15.4).
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10x
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
export const toLbs = (w, unit) => (unit === "kg" ? w * LB_PER_KG : w);
export const roundW = (n) => { const r = Math.round(n * 10) / 10; return r % 1 === 0 ? String(Math.round(r)) : r.toFixed(1); };
export const convertW = (val, from, to) => {
  const n = Number(val);
  if (!val || isNaN(n)) return val;
  if (from === to) return val;
  return roundW(from === "kg" ? n * LB_PER_KG : n / LB_PER_KG);
};

/* ------------------- exercise auto-detection ----------------------- */
/* Order matters: specific patterns before generic ones. */
const EX_DB = [
  [/hip thrust|glute bridge/i, ["Glutes", "Hamstrings"], "barbell"],
  [/romanian deadlift|\brdl\b|stiff.?leg/i, ["Hamstrings", "Glutes"], "barbell"],
  [/deadlift/i, ["Hamstrings", "Glutes", "Back"], "barbell"],
  [/front squat/i, ["Quads", "Core"], "barbell"],
  [/squat/i, ["Quads", "Glutes"], "barbell"],
  [/lunge|split squat|step.?up/i, ["Quads", "Glutes"], "dumbbell"],
  [/leg press/i, ["Quads", "Glutes"], "machine"],
  [/leg extension/i, ["Quads"], "machine"],
  [/leg curl|hamstring curl|nordic/i, ["Hamstrings"], "machine"],
  [/calf/i, ["Calves"], "machine"],
  [/hip abduction|abductor|clamshell|fire hydrant/i, ["Glutes"], "machine"],
  [/glute kickback|cable kickback|donkey kick/i, ["Glutes"], "machine"],
  [/kettlebell swing|kb swing/i, ["Glutes", "Hamstrings", "Back"], "kettlebell"],
  [/bench|chest press/i, ["Chest", "Triceps"], "barbell"],
  [/push.?up/i, ["Chest", "Triceps", "Core"], "bodyweight"],
  [/\bfly\b|flye|pec deck/i, ["Chest"], "dumbbell"],
  [/overhead press|shoulder press|\bohp\b|military press|arnold/i, ["Shoulders", "Triceps"], "dumbbell"],
  [/lateral raise|side raise|front raise/i, ["Shoulders"], "dumbbell"],
  [/face pull|rear delt/i, ["Shoulders", "Back"], "machine"],
  [/pull.?up|chin.?up|pulldown|pull.?down/i, ["Back", "Biceps"], "bodyweight"],
  [/\brow\b|rows/i, ["Back", "Biceps"], "barbell"],
  [/shrug/i, ["Back"], "dumbbell"],
  [/skull.?crusher|pushdown|tricep/i, ["Triceps"], "dumbbell"],
  [/curl/i, ["Biceps"], "dumbbell"],
  [/\bdip(s)?\b/i, ["Triceps", "Chest"], "bodyweight"],
  [/plank|crunch|sit.?up|\babs?\b|dead bug|leg raise|russian twist|hollow/i, ["Core"], "mat"],
  [/run|jog|treadmill|sprint/i, ["Quads", "Calves"], "cardio"],
  [/walk|hike/i, ["Calves", "Quads"], "cardio"],
  [/cycle|bike|spin|row erg|erg\b|elliptical/i, ["Quads", "Calves"], "cardio"],
  [/yoga|stretch|mobility|pilates/i, ["Core"], "mat"],
];

export function detectExercise(name) {
  const n = (name || "").trim();
  if (!n) return { muscles: [], icon: "dumbbell", matched: false };
  for (const [re, muscles, icon] of EX_DB) {
    if (re.test(n)) return { muscles: [...muscles], icon, matched: true };
  }
  return { muscles: [], icon: "dumbbell", matched: false };
}

/* ----------------------------- data -------------------------------- */

export function migrate(data) {
  if (!data.version) { // v1: kg, no units
    (data.sessions || []).forEach((s) => {
      (s.entries || []).forEach((e) => { if (!e.unit) e.unit = "kg"; });
      finalizeTotals(s);
    });
    data.version = 2;
  }
  if (data.version < 3) {
    (data.routines || []).forEach((r) =>
      (r.exercises || []).forEach((e) => {
        if (e.restSec == null) e.restSec = 90;
        if (e.superset === undefined) e.superset = null;
        if (!e.muscles || e.muscles.length === 0) e.muscles = detectExercise(e.name).muscles;
      })
    );
    data.version = 3;
  }
  return data;
}

export function finalizeTotals(session) {
  let vol = 0, reps = 0;
  const byMuscle = {};
  session.entries.forEach((e) => {
    const unit = e.unit || "lbs";
    e.sets.forEach((s) => {
      if (!s.done) return;
      const r = Number(s.reps) || 0;
      const v = toLbs(Number(s.weight) || 0, unit) * r;
      vol += v; reps += r;
      (e.muscles || []).forEach((m) => { byMuscle[m] = (byMuscle[m] || 0) + v; });
    });
  });
  session.totalVolume = vol;
  session.totalReps = reps;
  session.byMuscle = byMuscle;
  return session;
}

export function buildRecords(sessions) {
  const rec = {};
  sessions.forEach((sess) =>
    sess.entries.forEach((e) => {
      const key = e.name.trim().toLowerCase();
      if (!key) return;
      const unit = e.unit || "lbs";
      if (!rec[key]) rec[key] = { maxLbs: 0, maxReps: 0 };
      e.sets.forEach((s) => {
        if (!s.done) return;
        const w = toLbs(Number(s.weight) || 0, unit);
        const r = Number(s.reps) || 0;
        if (w > rec[key].maxLbs) rec[key].maxLbs = w;
        if (r > rec[key].maxReps) rec[key].maxReps = r;
      });
    })
  );
  return rec;
}

export function lastEntryFor(sessions, name) {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  for (const s of sorted) {
    const e = s.entries.find((x) => x.name.trim().toLowerCase() === key);
    if (e) return e;
  }
  return null;
}

export function buildEntry(sessions, { name, notes = "", muscles = [], defaultSets = 3, restSec = 90, superset = null }) {
  const auto = detectExercise(name);
  const finalMuscles = muscles.length ? muscles : auto.muscles;
  const last = lastEntryFor(sessions, name);
  if (last) {
    const usable = last.sets.filter((s) => s.weight !== "" || s.reps !== "");
    const src = usable.length ? usable : last.sets;
    return {
      name, notes: notes || last.notes || "",
      muscles: finalMuscles.length ? finalMuscles : last.muscles || [],
      unit: last.unit || "lbs", restSec, superset, sessionNote: "",
      sets: src.map((s) => ({
        weight: String(s.weight ?? ""), reps: String(s.reps ?? ""),
        done: false, ghostW: s.weight !== "", ghostR: s.reps !== "", badges: [],
      })),
    };
  }
  return {
    name, notes, muscles: finalMuscles, unit: "lbs", restSec, superset, sessionNote: "",
    sets: Array.from({ length: defaultSets }, () => ({ weight: "", reps: "", done: false, ghostW: false, ghostR: false, badges: [] })),
  };
}

export const fmtVol = (n) => `${Math.round(n).toLocaleString()} lb`;
export const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? [h, m, sec] : [m, sec]).map((x, i) => (i ? String(x).padStart(2, "0") : x)).join(":");
};
export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const fmtShort = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
