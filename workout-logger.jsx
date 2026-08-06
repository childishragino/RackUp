import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

/* ------------------------------------------------------------------ */
/*  RackUp — workout logger prototype (v3)                             */
/*  New: routine progress charts (volume / reps / duration with        */
/*  3mo · year · all-time ranges), supersets with colour coding,       */
/*  per-exercise rest timers (10s steps) with end-of-rest chime,       */
/*  auto muscle detection + exercise pictograms.                       */
/* ------------------------------------------------------------------ */

const STORE_KEY = "rackup:data";
const LEGACY_KEY = "ironlog:data"; // pre-rename data lives here
const LB_PER_KG = 2.20462;

const MUSCLES = [
  "Glutes", "Hamstrings", "Quads", "Calves",
  "Back", "Chest", "Shoulders", "Biceps", "Triceps", "Core",
];

const SUPERSETS = {
  A: { color: "#7C5CBF", bg: "#EFEAF8" },
  B: { color: "#2478B8", bg: "#E6F1F9" },
  C: { color: "#2E8B57", bg: "#E7F4ED" },
  D: { color: "#C2478D", bg: "#F9E9F2" },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const toLbs = (w, unit) => (unit === "kg" ? w * LB_PER_KG : w);
const roundW = (n) => { const r = Math.round(n * 10) / 10; return r % 1 === 0 ? String(Math.round(r)) : r.toFixed(1); };
const convertW = (val, from, to) => {
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

function detectExercise(name) {
  const n = (name || "").trim();
  if (!n) return { muscles: [], icon: "dumbbell", matched: false };
  for (const [re, muscles, icon] of EX_DB) {
    if (re.test(n)) return { muscles: [...muscles], icon, matched: true };
  }
  return { muscles: [], icon: "dumbbell", matched: false };
}

function ExIcon({ name, color }) {
  const { icon } = detectExercise(name);
  const c = color || "currentColor";
  const P = { fill: "none", stroke: c, strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  const svg = {
    barbell: (
      <g {...P}>
        <line x1="2" y1="10" x2="18" y2="10" />
        <rect x="3" y="6" width="2.6" height="8" rx="0.8" />
        <rect x="14.4" y="6" width="2.6" height="8" rx="0.8" />
      </g>
    ),
    dumbbell: (
      <g {...P}>
        <line x1="7" y1="10" x2="13" y2="10" />
        <rect x="4" y="6.5" width="2.6" height="7" rx="0.8" />
        <rect x="13.4" y="6.5" width="2.6" height="7" rx="0.8" />
      </g>
    ),
    machine: (
      <g {...P}>
        <line x1="5" y1="3.5" x2="5" y2="16.5" />
        <path d="M5 9 L11 9 L13.5 13" />
        <circle cx="12.6" cy="6.4" r="1.7" />
        <line x1="3" y1="16.5" x2="15" y2="16.5" />
      </g>
    ),
    bodyweight: (
      <g {...P}>
        <circle cx="10" cy="4.6" r="2" />
        <line x1="10" y1="6.8" x2="10" y2="12.5" />
        <path d="M4.8 8.6 L10 9.8 L15.2 8.6" />
        <path d="M7 17 L10 12.5 L13 17" />
      </g>
    ),
    cardio: (
      <g {...P}>
        <circle cx="12.6" cy="4.4" r="1.9" />
        <path d="M11.6 6.6 L9.4 10.4 L12.6 12.2 L11.2 16.6" />
        <path d="M9.4 10.4 L5.6 9.6" />
        <path d="M12.4 8 L15.8 9" />
        <path d="M12.6 12.2 L15.4 15" />
      </g>
    ),
    mat: (
      <g {...P}>
        <rect x="2.6" y="12" width="14.8" height="3.6" rx="1.8" />
        <path d="M15 12 A 2.4 2.4 0 0 0 15 7.4 L 12 7.4" />
      </g>
    ),
    kettlebell: (
      <g {...P}>
        <path d="M6.8 8.2 A 3.4 3.4 0 0 1 13.2 8.2" transform="translate(0,-2.4)" />
        <circle cx="10" cy="11.4" r="4.4" />
      </g>
    ),
  }[icon];
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="il-exicon">
      {svg}
    </svg>
  );
}

/* --------------------------- audio chime --------------------------- */
let _audio = null;
function ensureAudio() {
  try {
    _audio = _audio || new (window.AudioContext || window.webkitAudioContext)();
    if (_audio.state === "suspended") _audio.resume();
  } catch { /* no audio available */ }
}
function chime() {
  try {
    if (!_audio) return;
    const play = (delay, freq) => {
      const o = _audio.createOscillator();
      const g = _audio.createGain();
      const t = _audio.currentTime + delay;
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(_audio.destination);
      o.start(t); o.stop(t + 0.32);
    };
    play(0, 880); play(0.32, 1174.7); play(0.64, 1174.7);
  } catch { /* ignore */ }
}

/* ----------------------------- data -------------------------------- */

function seedData() {
  const mk = (name, notes, defaultSets, superset = null, restSec = 90) => {
    const d = detectExercise(name);
    return { id: uid(), name, notes, muscles: d.muscles, defaultSets, superset, restSec };
  };
  const routine = {
    id: uid(), name: "Lower Body Day",
    exercises: [
      mk("Hip Thrust", "Pause 1s at the top", 3, null, 120),
      mk("Back Squat", "Brace hard, hit depth", 3, null, 120),
      mk("Romanian Deadlift", "Soft knees, long hamstrings", 3, "A", 60),
      mk("Walking Lunge", "", 2, "A", 60),
    ],
  };

  const sess = (daysAgo, mins, rows) => {
    const t0 = Date.now() - daysAgo * 24 * 3600 * 1000;
    const s = {
      id: uid(), name: "Lower Body Day", startedAt: t0, endedAt: t0 + mins * 60 * 1000, prs: [],
      entries: rows.map(([name, sets]) => {
        const d = detectExercise(name);
        return { name, notes: "", muscles: d.muscles, unit: "lbs", restSec: 90, superset: null,
          sets: sets.map(([w, r]) => ({ weight: String(w), reps: String(r), done: true })) };
      }),
    };
    return finalizeTotals(s);
  };

  return {
    version: 3,
    routines: [routine],
    sessions: [
      sess(10, 48, [
        ["Hip Thrust", [[125, 10], [125, 10], [125, 8]]],
        ["Back Squat", [[105, 8], [105, 8], [105, 6]]],
        ["Romanian Deadlift", [[90, 10], [90, 10]]],
      ]),
      sess(3, 52, [
        ["Hip Thrust", [[135, 10], [135, 10], [135, 8]]],
        ["Back Squat", [[115, 8], [115, 8], [115, 6]]],
        ["Romanian Deadlift", [[95, 10], [95, 10]]],
      ]),
    ],
  };
}

function migrate(data) {
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

function finalizeTotals(session) {
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

function buildRecords(sessions) {
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

function lastEntryFor(sessions, name) {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  for (const s of sorted) {
    const e = s.entries.find((x) => x.name.trim().toLowerCase() === key);
    if (e) return e;
  }
  return null;
}

function buildEntry(sessions, { name, notes = "", muscles = [], defaultSets = 3, restSec = 90, superset = null }) {
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

const fmtVol = (n) => `${Math.round(n).toLocaleString()} lb`;
const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (h ? [h, m, sec] : [m, sec]).map((x, i) => (i ? String(x).padStart(2, "0") : x)).join(":");
};
const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const fmtShort = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/* ------------------------------------------------------------------ */

export default function RackUp() {
  const [data, setData] = useState(null);
  const [view, setView] = useState({ name: "home" });
  const [saveState, setSaveState] = useState("idle");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    (async () => {
      let raw = null;
      try {
        const res = await window.storage.get(STORE_KEY);
        raw = res && res.value ? res.value : null;
      } catch { /* no data under new key */ }
      if (!raw) {
        try {
          const legacy = await window.storage.get(LEGACY_KEY);
          raw = legacy && legacy.value ? legacy.value : null;
        } catch { /* no legacy data either */ }
      }
      try {
        const parsed = raw ? migrate(JSON.parse(raw)) : seedData();
        setData(parsed);
        window.storage.set(STORE_KEY, JSON.stringify(parsed)).catch(() => {});
      } catch {
        setData(seedData());
      }
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    try {
      setSaveState("saving");
      await window.storage.set(STORE_KEY, JSON.stringify(next));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch { setSaveState("error"); }
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F1F4F6", color: "#5C6B77", fontFamily: "system-ui" }}>
        Loading your log…
      </div>
    );
  }

  const records = buildRecords(data.sessions);
  const startRoutine = (routine) =>
    setView({
      name: "active",
      session: {
        id: uid(), name: routine.name, startedAt: Date.now(), prs: [],
        entries: routine.exercises.map((e) => buildEntry(data.sessions, e)),
      },
    });

  return (
    <div className="il-root">
      <Style />
      <header className="il-top">
        <div className="il-brand"><span className="il-plate" aria-hidden="true" />RACKUP</div>
        <span className={`il-save il-save-${saveState}`}>
          {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "error" ? "not saved" : ""}
        </span>
      </header>

      {view.name === "home" && (
        <Home
          data={data}
          onOpenRoutine={(r) => setView({ name: "detail", routineId: r.id })}
          onStartEmpty={() => setView({ name: "active", session: { id: uid(), name: "Empty Workout", startedAt: Date.now(), prs: [], entries: [] } })}
          onNewRoutine={() => setView({ name: "edit", routine: { id: uid(), name: "", exercises: [] } })}
          onOpenSession={(s) => setView({ name: "summary", session: s, fromHistory: true })}
        />
      )}

      {view.name === "detail" && (() => {
        const routine = data.routines.find((r) => r.id === view.routineId);
        if (!routine) { setView({ name: "home" }); return null; }
        return (
          <RoutineDetail
            routine={routine}
            sessions={data.sessions}
            onBack={() => setView({ name: "home" })}
            onStart={() => startRoutine(routine)}
            onEdit={() => setView({ name: "edit", routine: JSON.parse(JSON.stringify(routine)) })}
            onDelete={() =>
              setConfirm({
                msg: `Delete "${routine.name}"? Past sessions are kept.`, yesLabel: "Delete",
                onYes: () => { persist({ ...data, routines: data.routines.filter((x) => x.id !== routine.id) }); setView({ name: "home" }); },
              })
            }
          />
        );
      })()}

      {view.name === "edit" && (
        <RoutineEditor
          routine={view.routine}
          onCancel={() => setView({ name: "home" })}
          onSave={(r) => {
            const exists = data.routines.some((x) => x.id === r.id);
            persist({ ...data, routines: exists ? data.routines.map((x) => (x.id === r.id ? r : x)) : [...data.routines, r] });
            setView({ name: "detail", routineId: r.id });
          }}
        />
      )}

      {view.name === "active" && (
        <ActiveSession
          session={view.session}
          records={records}
          sessions={data.sessions}
          onUpdate={(s) => setView({ name: "active", session: s })}
          onDiscard={() =>
            setConfirm({ msg: "Discard this workout? Nothing will be saved.", yesLabel: "Discard", onYes: () => setView({ name: "home" }) })
          }
          onFinish={(s) => {
            const finish = (sess) => {
              const finished = finalizeTotals({ ...sess, endedAt: Date.now() });
              persist({ ...data, sessions: [...data.sessions, finished] });
              setView({ name: "summary", session: finished });
            };
            const anyDone = s.entries.some((e) => e.sets.some((x) => x.done));
            if (!anyDone) setConfirm({ msg: "No sets are marked done. End anyway?", yesLabel: "End workout", onYes: () => finish(s) });
            else finish(s);
          }}
        />
      )}

      {view.name === "summary" && (
        <Summary session={view.session} fromHistory={view.fromHistory} onDone={() => setView({ name: "home" })} />
      )}

      {confirm && (
        <div className="il-overlay" role="dialog" aria-modal="true" aria-label="Confirm">
          <div className="il-dialog">
            <p>{confirm.msg}</p>
            <div className="il-btnrow">
              <button className="il-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="il-primary" onClick={() => { const fn = confirm.onYes; setConfirm(null); fn(); }}>{confirm.yesLabel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- HOME ------------------------------- */

function Home({ data, onOpenRoutine, onStartEmpty, onNewRoutine, onOpenSession }) {
  const sessions = [...data.sessions].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <main className="il-main">
      <button className="il-primary il-wide il-emptybtn" onClick={onStartEmpty}>Start empty workout</button>

      <section>
        <div className="il-sechead">
          <h2>Routines</h2>
          <button className="il-ghost" onClick={onNewRoutine}>+ New routine</button>
        </div>
        {data.routines.length === 0 && <p className="il-empty">No routines yet. Create one to start logging.</p>}
        {data.routines.map((r) => (
          <button key={r.id} className="il-card il-history" onClick={() => onOpenRoutine(r)}>
            <div>
              <h3>{r.name || "Untitled"}</h3>
              <p className="il-muted">
                {r.exercises.length} exercise{r.exercises.length === 1 ? "" : "s"}
                {r.exercises.length > 0 && " · " + r.exercises.map((e) => e.name).filter(Boolean).slice(0, 3).join(", ")}
                {r.exercises.length > 3 && "…"}
              </p>
            </div>
            <span className="il-muted il-arrow">→</span>
          </button>
        ))}
      </section>

      <section>
        <div className="il-sechead"><h2>History</h2></div>
        {sessions.length === 0 && <p className="il-empty">Finished workouts will show up here.</p>}
        {sessions.map((s) => (
          <button key={s.id} className="il-card il-history" onClick={() => onOpenSession(s)}>
            <div>
              <h3>{s.name}</h3>
              <p className="il-muted">
                {fmtDate(s.startedAt)} · {fmtClock((s.endedAt || s.startedAt) - s.startedAt)}
                {s.prs && s.prs.length > 0 && <span className="il-chip il-chip-pr il-chip-inline">{s.prs.length} PR</span>}
              </p>
            </div>
            <div className="il-num">{fmtVol(s.totalVolume || 0)}</div>
          </button>
        ))}
      </section>
    </main>
  );
}

/* ------------------------- ROUTINE DETAIL -------------------------- */

const RANGES = { "3m": 90, "1y": 365, all: Infinity };
const TABS = [
  { key: "volume", label: "Volume", unit: "lb" },
  { key: "reps", label: "Reps", unit: "reps" },
  { key: "duration", label: "Duration", unit: "min" },
];

function RoutineDetail({ routine, sessions, onBack, onStart, onEdit, onDelete }) {
  const [tab, setTab] = useState("volume");
  const [range, setRange] = useState("3m");

  const points = useMemo(() => {
    const cutoff = RANGES[range] === Infinity ? 0 : Date.now() - RANGES[range] * 24 * 3600 * 1000;
    return sessions
      .filter((s) => s.name === routine.name && s.startedAt >= cutoff)
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((s) => ({
        label: fmtShort(s.startedAt),
        volume: Math.round(s.totalVolume || 0),
        reps: s.totalReps ?? s.entries.reduce((n, e) => n + e.sets.reduce((m, x) => m + (x.done ? Number(x.reps) || 0 : 0), 0), 0),
        duration: Math.round(((s.endedAt || s.startedAt) - s.startedAt) / 60000),
      }));
  }, [sessions, routine.name, range]);

  const active = TABS.find((t) => t.key === tab);

  return (
    <main className="il-main">
      <button className="il-ghost il-back" onClick={onBack}>← Back</button>
      <div className="il-sechead"><h2>{routine.name}</h2></div>

      <div className="il-card il-chartcard">
        <div className="il-chartbar">
          <div className="il-tabs" role="tablist" aria-label="Chart metric">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key}
                className={`il-tab ${tab === t.key ? "on" : ""}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <select className="il-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range">
            <option value="3m">Last 3 months</option>
            <option value="1y">Year</option>
            <option value="all">All time</option>
          </select>
        </div>

        {points.length === 0 ? (
          <p className="il-empty">No sessions of this routine in this range yet.</p>
        ) : (
          <div className="il-chartwrap">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -6 }}>
                <CartesianGrid stroke="#E4EAEF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5C6B77" }} tickLine={false} axisLine={{ stroke: "#D9E0E6" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5C6B77" }} tickLine={false} axisLine={false} width={48}
                  domain={["auto", "auto"]} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()} ${active.unit}`, active.label]}
                  contentStyle={{ borderRadius: 10, border: "1.5px solid #D9E0E6", fontSize: 13 }}
                />
                <Line type="monotone" dataKey={tab} stroke="#E4572E" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#E4572E", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="il-muted il-chartnote">{active.label} per session ({active.unit})</p>
          </div>
        )}
      </div>

      <section>
        <div className="il-sechead"><h2>Exercises</h2></div>
        {routine.exercises.map((e) => (
          <div key={e.id} className="il-card il-exlist" style={e.superset ? { borderLeft: `4px solid ${SUPERSETS[e.superset].color}` } : null}>
            <ExIcon name={e.name} />
            <div className="il-exlist-info">
              <strong>{e.name}</strong>
              <span className="il-muted">
                {e.defaultSets} sets · rest {e.restSec ?? 90}s · {(e.muscles || []).join(", ") || "no tags"}
              </span>
            </div>
            {e.superset && (
              <span className="il-chip" style={{ background: SUPERSETS[e.superset].bg, color: SUPERSETS[e.superset].color, border: `1px solid ${SUPERSETS[e.superset].color}` }}>
                SS {e.superset}
              </span>
            )}
          </div>
        ))}
      </section>

      <div className="il-btnrow">
        <button className="il-ghost il-danger" onClick={onDelete}>Delete</button>
        <button className="il-ghost" onClick={onEdit}>Edit</button>
        <button className="il-primary il-wide" onClick={onStart} disabled={routine.exercises.length === 0}>Start workout</button>
      </div>
    </main>
  );
}

/* ------------------------- ROUTINE EDITOR -------------------------- */

function RoutineEditor({ routine, onSave, onCancel }) {
  const [r, setR] = useState(routine);
  const [chipOpen, setChipOpen] = useState({});
  const setEx = (i, patch) => setR({ ...r, exercises: r.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });

  return (
    <main className="il-main">
      <div className="il-sechead"><h2>{routine.name ? "Edit routine" : "New routine"}</h2></div>

      <label className="il-label" htmlFor="rname">Routine name</label>
      <input id="rname" className="il-input il-input-big" placeholder="e.g. Lower Body Day"
        value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />

      {r.exercises.map((ex, i) => {
        const det = detectExercise(ex.name);
        return (
          <div key={ex.id} className="il-card" style={ex.superset ? { borderLeft: `4px solid ${SUPERSETS[ex.superset].color}` } : null}>
            <div className="il-exedit-row">
              <span className="il-iconbox"><ExIcon name={ex.name} /></span>
              <input className="il-input" placeholder="Exercise name" value={ex.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const d = detectExercise(name);
                  setEx(i, ex.manualMuscles ? { name } : { name, muscles: d.muscles });
                }} />
              <button className="il-ghost il-danger" aria-label={`Remove ${ex.name || "exercise"}`}
                onClick={() => setR({ ...r, exercises: r.exercises.filter((_, j) => j !== i) })}>✕</button>
            </div>
            <input className="il-input il-input-notes" placeholder="Notes (cues, tempo, setup…)" value={ex.notes}
              onChange={(e) => setEx(i, { notes: e.target.value })} />

            <p className="il-muted il-autoline">
              Muscles: {(ex.muscles || []).join(", ") || (det.matched ? det.muscles.join(", ") : "—")}
              {!ex.manualMuscles && <span className="il-autotag"> auto</span>}
              <button className="il-linkbtn" onClick={() => setChipOpen({ ...chipOpen, [ex.id]: !chipOpen[ex.id] })}>
                {chipOpen[ex.id] ? "done" : "edit"}
              </button>
            </p>
            {chipOpen[ex.id] && (
              <MuscleChips value={ex.muscles || []} onChange={(m) => setEx(i, { muscles: m, manualMuscles: true })} />
            )}

            <div className="il-exopts">
              <label className="il-label il-inlinelab">
                Sets
                <input className="il-input il-input-sets" type="number" min="1" max="10" value={ex.defaultSets}
                  onChange={(e) => setEx(i, { defaultSets: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} />
              </label>
              <label className="il-label il-inlinelab">
                Rest (s)
                <input className="il-input il-input-sets" type="number" min="0" max="600" step="10" value={ex.restSec ?? 90}
                  onChange={(e) => setEx(i, { restSec: Math.max(0, Math.min(600, Math.round((Number(e.target.value) || 0) / 10) * 10)) })} />
              </label>
              <label className="il-label il-inlinelab">
                Superset
                <select className="il-select" value={ex.superset || ""} onChange={(e) => setEx(i, { superset: e.target.value || null })}>
                  <option value="">None</option>
                  {Object.keys(SUPERSETS).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
            </div>
          </div>
        );
      })}

      <button className="il-ghost il-dashed il-wide"
        onClick={() => setR({ ...r, exercises: [...r.exercises, { id: uid(), name: "", notes: "", muscles: [], defaultSets: 3, restSec: 90, superset: null }] })}>
        + Add exercise
      </button>

      <p className="il-muted il-sshint">Give two or more exercises the same superset letter (A–D) to pair them back-to-back — they'll share a colour.</p>

      <div className="il-btnrow">
        <button className="il-ghost" onClick={onCancel}>Cancel</button>
        <button className="il-primary"
          disabled={!r.name.trim() || r.exercises.length === 0 || r.exercises.some((e) => !e.name.trim())}
          onClick={() => onSave({ ...r, name: r.name.trim() })}>
          Save routine
        </button>
      </div>
    </main>
  );
}

function MuscleChips({ value, onChange }) {
  return (
    <div className="il-chips">
      {MUSCLES.map((m) => {
        const on = value.includes(m);
        return (
          <button key={m} className={`il-chip il-chip-toggle ${on ? "on" : ""}`} aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== m) : [...value, m])}>
            {m}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------- ACTIVE SESSION ------------------------- */

function ActiveSession({ session, records, sessions, onUpdate, onFinish, onDiscard }) {
  const [now, setNow] = useState(Date.now());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [rest, setRest] = useState(null); // {name, total, endsAt, over, clearAt}
  const chimed = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!rest) { chimed.current = false; return; }
    if (!rest.over && now >= rest.endsAt) {
      if (!chimed.current) { chimed.current = true; chime(); }
      setRest({ ...rest, over: true, clearAt: now + 5000 });
    } else if (rest.over && now >= rest.clearAt) {
      setRest(null);
      chimed.current = false;
    }
  }, [now, rest]);

  const doneVolume = useMemo(() => {
    let v = 0;
    session.entries.forEach((e) =>
      e.sets.forEach((s) => { if (s.done) v += toLbs(Number(s.weight) || 0, e.unit || "lbs") * (Number(s.reps) || 0); })
    );
    return v;
  }, [session]);

  const patchSet = (ei, si, patch) =>
    onUpdate({
      ...session,
      entries: session.entries.map((e, i) =>
        i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) }
      ),
    });

  const patchEntry = (ei, patch) =>
    onUpdate({ ...session, entries: session.entries.map((e, i) => (i !== ei ? e : { ...e, ...patch })) });

  const toggleUnit = (ei) => {
    const e = session.entries[ei];
    const from = e.unit || "lbs";
    const to = from === "lbs" ? "kg" : "lbs";
    patchEntry(ei, { unit: to, sets: e.sets.map((s) => ({ ...s, weight: convertW(s.weight, from, to) })) });
  };

  const toggleDone = (ei, si) => {
    ensureAudio(); // user gesture — unlock audio for the rest chime
    const entry = session.entries[ei];
    const set = entry.sets[si];
    if (set.done) return patchSet(ei, si, { done: false, badges: [] });

    const unit = entry.unit || "lbs";
    const wLbs = toLbs(Number(set.weight) || 0, unit);
    const rp = Number(set.reps) || 0;
    const rec = records[entry.name.trim().toLowerCase()];
    const badges = [];
    let prs = session.prs;
    if (rec && wLbs > 0 && rp > 0) {
      if (wLbs > rec.maxLbs + 0.01) {
        badges.push("pr");
        prs = [...prs, { exercise: entry.name, kind: "weight", value: set.weight, unit, prev: convertW(roundW(rec.maxLbs), "lbs", unit) }];
      }
      if (rp > rec.maxReps) {
        badges.push("rep");
        prs = [...prs, { exercise: entry.name, kind: "reps", value: rp, prev: rec.maxReps }];
      }
    }
    onUpdate({
      ...session, prs,
      entries: session.entries.map((e, i) =>
        i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, done: true, badges, ghostW: false, ghostR: false })) }
      ),
    });
    const restSec = entry.restSec ?? 90;
    if (restSec > 0) {
      chimed.current = false;
      setRest({ name: entry.name, total: restSec, endsAt: Date.now() + restSec * 1000, over: false });
    }
  };

  const addExercise = () => {
    if (!newName.trim()) return;
    onUpdate({ ...session, entries: [...session.entries, buildEntry(sessions, { name: newName.trim(), defaultSets: 3 })] });
    setNewName(""); setAdding(false);
  };

  const restRemaining = rest && !rest.over ? rest.endsAt - now : 0;
  const detNew = detectExercise(newName);

  return (
    <main className="il-main">
      <div className="il-livebar">
        <div className="il-livebar-main">
          <div className="il-livebar-left">
            <input className="il-livebar-name" value={session.name} aria-label="Workout name"
              onChange={(e) => onUpdate({ ...session, name: e.target.value })} />
            <div className="il-livebar-vol il-num">{fmtVol(doneVolume)} moved</div>
          </div>
          <div className="il-clock il-num" aria-label="elapsed time">{fmtClock(now - session.startedAt)}</div>
        </div>
        {rest && (
          <div className={`il-restrow ${rest.over ? "over" : ""}`} role="timer" aria-live="polite">
            {rest.over ? (
              <span className="il-restlabel">Rest over — go!</span>
            ) : (
              <>
                <span className="il-restlabel">Rest · {rest.name}</span>
                <span className="il-num il-resttime">{fmtClock(restRemaining)}</span>
                <button className="il-restbtn" onClick={() => setRest({ ...rest, endsAt: rest.endsAt + 10000, total: rest.total + 10 })}>+10s</button>
                <button className="il-restbtn" onClick={() => setRest(null)}>Skip</button>
              </>
            )}
            {!rest.over && (
              <span className="il-restbar-track"><span className="il-restbar" style={{ width: `${Math.max(0, Math.min(100, (restRemaining / (rest.total * 1000)) * 100))}%` }} /></span>
            )}
          </div>
        )}
      </div>

      {session.entries.length === 0 && (
        <p className="il-empty">Empty workout — add your first exercise below. If you've done it before, last time's numbers pre-fill in grey.</p>
      )}

      {session.entries.map((entry, ei) => {
        const unit = entry.unit || "lbs";
        const ss = entry.superset ? SUPERSETS[entry.superset] : null;
        return (
          <section key={ei} className="il-card" style={ss ? { borderLeft: `4px solid ${ss.color}` } : null}>
            <div className="il-exhead">
              <div className="il-exhead-left">
                <ExIcon name={entry.name} color={ss ? ss.color : undefined} />
                <h3>{entry.name}</h3>
                {ss && <span className="il-chip" style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.color}` }}>SS {entry.superset}</span>}
              </div>
              <button className="il-ghost il-danger il-exremove" aria-label={`Remove ${entry.name}`}
                onClick={() => onUpdate({ ...session, entries: session.entries.filter((_, i) => i !== ei) })}>✕</button>
            </div>
            {entry.notes ? <p className="il-notes">{entry.notes}</p> : null}
            <input
              className="il-input il-sessionnote"
              placeholder="Session note (just for today — e.g. left knee felt off)…"
              maxLength={160}
              aria-label={`${entry.name} session note`}
              value={entry.sessionNote || ""}
              onChange={(e) => patchEntry(ei, { sessionNote: e.target.value })}
            />
            <div className="il-restcfg">
              <span className="il-muted">Rest</span>
              <button className="il-stepbtn" aria-label="rest minus 10 seconds"
                onClick={() => patchEntry(ei, { restSec: Math.max(0, (entry.restSec ?? 90) - 10) })}>−</button>
              <span className="il-num il-restval">{entry.restSec ?? 90}s</span>
              <button className="il-stepbtn" aria-label="rest plus 10 seconds"
                onClick={() => patchEntry(ei, { restSec: Math.min(600, (entry.restSec ?? 90) + 10) })}>+</button>
            </div>

            <div className="il-setgrid il-sethead">
              <span>SET</span>
              <button className="il-unitbtn" onClick={() => toggleUnit(ei)}
                aria-label={`Switch ${entry.name} to ${unit === "lbs" ? "kilograms" : "pounds"}`}>
                {unit === "lbs" ? "LB" : "KG"} ⇄
              </button>
              <span>REPS</span><span>DONE</span><span />
            </div>
            {entry.sets.map((set, si) => (
              <div key={si} className={`il-setgrid il-setrow ${set.done ? "done" : ""}`}>
                <span className="il-setnum il-num">{si + 1}</span>
                <input className={`il-input il-num ${set.ghostW ? "ghost" : ""}`}
                  type="number" inputMode="decimal" placeholder="0" min="0"
                  aria-label={`${entry.name} set ${si + 1} weight in ${unit}`}
                  value={set.weight} disabled={set.done}
                  onChange={(e) => patchSet(ei, si, { weight: e.target.value, ghostW: false })} />
                <input className={`il-input il-num ${set.ghostR ? "ghost" : ""}`}
                  type="number" inputMode="numeric" placeholder="0" min="0"
                  aria-label={`${entry.name} set ${si + 1} reps`}
                  value={set.reps} disabled={set.done}
                  onChange={(e) => patchSet(ei, si, { reps: e.target.value, ghostR: false })} />
                <button className={`il-check ${set.done ? "on" : ""}`} role="checkbox" aria-checked={set.done}
                  aria-label={`mark set ${si + 1} done`} onClick={() => toggleDone(ei, si)}>
                  {set.done ? "✓" : ""}
                </button>
                <span className="il-badgecell">
                  {set.badges && set.badges.includes("pr") && <span className="il-chip il-chip-pr">PR</span>}
                  {set.badges && set.badges.includes("rep") && <span className="il-chip il-chip-rep">REP RECORD</span>}
                </span>
              </div>
            ))}
            <button className="il-ghost il-dashed il-wide"
              onClick={() => patchEntry(ei, { sets: [...entry.sets, { weight: "", reps: "", done: false, ghostW: false, ghostR: false, badges: [] }] })}>
              + Add set
            </button>
          </section>
        );
      })}

      {adding ? (
        <div className="il-card">
          <h3>Add exercise</h3>
          <div className="il-exedit-row">
            <span className="il-iconbox"><ExIcon name={newName} /></span>
            <input className="il-input" placeholder="Exercise name (e.g. Hip Thrust)" value={newName} autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addExercise(); }} />
          </div>
          <p className="il-muted il-addhint">
            {newName.trim() === "" ? "Muscles are detected automatically from the name."
              : lastEntryFor(sessions, newName)
                ? `Found history — last session's sets will pre-fill in grey. Muscles: ${detNew.muscles.join(", ") || "—"}`
                : detNew.matched
                  ? `Detected muscles: ${detNew.muscles.join(", ")}`
                  : "No muscle match — it'll log without tags (you can tag it later in a routine)."}
          </p>
          <div className="il-btnrow">
            <button className="il-ghost" onClick={() => { setAdding(false); setNewName(""); }}>Cancel</button>
            <button className="il-primary" disabled={!newName.trim()} onClick={addExercise}>Add</button>
          </div>
        </div>
      ) : (
        <button className="il-ghost il-dashed il-wide" onClick={() => setAdding(true)}>+ Add exercise</button>
      )}

      <div className="il-btnrow il-endrow">
        <button className="il-ghost il-danger" onClick={onDiscard}>Discard</button>
        <button className="il-primary" onClick={() => onFinish(session)}>End workout</button>
      </div>
    </main>
  );
}

/* ----------------------------- SUMMARY ----------------------------- */

function Summary({ session, onDone, fromHistory }) {
  const muscles = Object.entries(session.byMuscle || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxV = muscles.length ? muscles[0][1] : 1;
  const dur = (session.endedAt || session.startedAt) - session.startedAt;
  const setsDone = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  return (
    <main className="il-main">
      <div className="il-sechead"><h2>{fromHistory ? session.name : "Session complete"}</h2></div>
      <p className="il-muted il-summary-date">{fmtDate(session.startedAt)}</p>

      <div className="il-statrow">
        <div className="il-stat"><div className="il-stat-v il-num">{fmtClock(dur)}</div><div className="il-stat-l">Duration</div></div>
        <div className="il-stat"><div className="il-stat-v il-num">{fmtVol(session.totalVolume || 0)}</div><div className="il-stat-l">Total moved</div></div>
        <div className="il-stat"><div className="il-stat-v il-num">{setsDone}</div><div className="il-stat-l">Sets done</div></div>
      </div>

      {session.prs && session.prs.length > 0 && (
        <section className="il-card il-prbox">
          <h3>Records set today</h3>
          {session.prs.map((p, i) => (
            <div key={i} className="il-prline">
              <span className={`il-chip ${p.kind === "weight" ? "il-chip-pr" : "il-chip-rep"}`}>
                {p.kind === "weight" ? "PR" : "REP RECORD"}
              </span>
              <span>
                {p.exercise}: <strong className="il-num">{p.value}{p.kind === "weight" ? ` ${p.unit || "lb"}` : " reps"}</strong>
                <span className="il-muted"> (was {p.prev}{p.kind === "weight" ? ` ${p.unit || "lb"}` : ""})</span>
              </span>
            </div>
          ))}
        </section>
      )}

      {session.entries.some((e) => e.sessionNote && e.sessionNote.trim()) && (
        <section className="il-card">
          <h3>Session notes</h3>
          {session.entries.filter((e) => e.sessionNote && e.sessionNote.trim()).map((e, i) => (
            <p key={i} className="il-sessionnote-line">
              <strong>{e.name}:</strong> {e.sessionNote}
            </p>
          ))}
        </section>
      )}

      <section className="il-card">
        <h3>Muscles worked</h3>
        {muscles.length === 0 && <p className="il-empty">No completed sets with muscle tags.</p>}
        {muscles.map(([m, v]) => (
          <div key={m} className="il-musrow">
            <span className="il-muslabel">{m}</span>
            <div className="il-musbar-track"><div className="il-musbar" style={{ width: `${Math.max(6, (v / maxV) * 100)}%` }} /></div>
            <span className="il-num il-musval">{fmtVol(v)}</span>
          </div>
        ))}
      </section>

      <div className="il-btnrow">
        <button className="il-primary il-wide" onClick={onDone}>Back to home</button>
      </div>
    </main>
  );
}

/* ------------------------------ STYLE ------------------------------ */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

      .il-root {
        --paper:#F1F4F6; --card:#FFFFFF; --ink:#17222B; --muted:#5C6B77;
        --ghost:#9AA7B1; --line:#D9E0E6; --clip:#E4572E; --clip-dark:#C4441F;
        --gold-bg:#FBEEC9; --gold-ink:#8A6510; --teal-bg:#D7F2EE; --teal-ink:#0F766E;
        min-height:100vh; background:var(--paper); color:var(--ink);
        font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
        font-size:15px; line-height:1.45;
      }
      .il-root *, .il-root *::before, .il-root *::after { box-sizing:border-box; }
      .il-num { font-family:'IBM Plex Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums; }

      .il-top { display:flex; justify-content:space-between; align-items:center;
        padding:14px 16px; border-bottom:2px solid var(--ink); background:var(--card);
        position:sticky; top:0; z-index:5; }
      .il-brand { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:22px;
        letter-spacing:.12em; display:flex; align-items:center; gap:9px; }
      .il-plate { width:16px; height:16px; border-radius:50%; background:var(--ink);
        box-shadow:inset 0 0 0 3.5px var(--card), inset 0 0 0 6px var(--ink); }
      .il-save { font-size:12px; color:var(--muted); min-width:60px; text-align:right; }
      .il-save-error { color:var(--clip-dark); }

      .il-main { max-width:640px; margin:0 auto; padding:16px 16px 56px; }
      section { margin-bottom:26px; }
      .il-sechead { display:flex; justify-content:space-between; align-items:baseline; margin:6px 0 10px; }
      .il-sechead h2 { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:20px;
        letter-spacing:.1em; text-transform:uppercase; margin:0; }
      h3 { font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:19px;
        letter-spacing:.05em; text-transform:uppercase; margin:0 0 4px; }
      .il-muted { color:var(--muted); font-size:13px; margin:2px 0 0; }
      .il-empty { color:var(--muted); font-size:14px; border:1.5px dashed var(--line);
        border-radius:10px; padding:14px; text-align:center; margin-bottom:12px; }
      .il-back { margin-bottom:10px; }
      .il-arrow { font-size:18px; }

      .il-card { background:var(--card); border:1.5px solid var(--line); border-radius:12px;
        padding:14px; margin-bottom:10px; }
      .il-history { display:flex; width:100%; align-items:center; justify-content:space-between;
        gap:12px; text-align:left; cursor:pointer; font:inherit; color:inherit; }
      .il-history:hover { border-color:var(--ink); }
      .il-history .il-num { font-size:15px; font-weight:600; white-space:nowrap; }

      button { font:inherit; }
      .il-primary { background:var(--clip); color:#fff; border:none; border-radius:10px;
        padding:10px 18px; font-weight:600; cursor:pointer; letter-spacing:.02em; }
      .il-primary:hover { background:var(--clip-dark); }
      .il-primary:disabled { background:var(--line); color:var(--muted); cursor:not-allowed; }
      .il-ghost { background:transparent; border:1.5px solid var(--line); border-radius:10px;
        padding:9px 14px; color:var(--ink); cursor:pointer; }
      .il-ghost:hover { border-color:var(--ink); }
      .il-danger { color:var(--clip-dark); }
      .il-dashed { border-style:dashed; }
      .il-wide { width:100%; }
      .il-emptybtn { margin-bottom:22px; padding:13px; font-size:16px; }
      .il-primary:focus-visible, .il-ghost:focus-visible, .il-check:focus-visible, .il-unitbtn:focus-visible,
      .il-input:focus-visible, .il-chip-toggle:focus-visible, .il-history:focus-visible, .il-livebar-name:focus-visible,
      .il-tab:focus-visible, .il-select:focus-visible, .il-stepbtn:focus-visible, .il-restbtn:focus-visible, .il-linkbtn:focus-visible {
        outline:2.5px solid var(--clip); outline-offset:2px; }
      .il-btnrow { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; align-items:center; }
      .il-btnrow .il-wide { flex:1; width:auto; }
      .il-endrow { margin-top:20px; }

      .il-label { display:block; font-size:13px; color:var(--muted); margin:10px 0 4px; }
      .il-inlinelab { display:flex; align-items:center; gap:8px; margin:0; }
      .il-input { width:100%; border:1.5px solid var(--line); border-radius:9px; padding:9px 10px;
        background:var(--card); color:var(--ink); font-size:15px; }
      .il-input:disabled { background:var(--paper); color:var(--muted); }
      .il-input.ghost { color:var(--ghost); }
      .il-input-big { font-size:18px; margin-bottom:14px; }
      .il-input-notes { margin-top:8px; font-size:13px; }
      .il-input-sets { width:74px; }
      .il-select { border:1.5px solid var(--line); border-radius:9px; padding:8px 10px;
        background:var(--card); color:var(--ink); font-size:13px; }
      .il-exedit-row { display:flex; gap:8px; align-items:center; }
      .il-iconbox { display:grid; place-items:center; width:38px; height:38px; flex:none;
        border:1.5px solid var(--line); border-radius:9px; color:var(--muted); }
      .il-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      .il-addhint { margin:8px 0 0; }
      .il-autoline { margin-top:8px; }
      .il-autotag { font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--teal-ink);
        background:var(--teal-bg); border-radius:5px; padding:1px 5px; margin-left:4px; }
      .il-linkbtn { background:none; border:none; color:var(--clip-dark); cursor:pointer;
        font-size:12px; text-decoration:underline; margin-left:8px; padding:0; }
      .il-exopts { display:flex; flex-wrap:wrap; gap:14px; margin-top:12px; align-items:center; }
      .il-sshint { margin:2px 0 14px; }

      .il-chip { display:inline-block; border-radius:999px; padding:3px 9px; font-size:11px;
        font-weight:700; letter-spacing:.06em; white-space:nowrap; }
      .il-chip-inline { margin-left:8px; vertical-align:1px; }
      .il-chip-toggle { background:var(--paper); border:1.5px solid var(--line); color:var(--muted);
        cursor:pointer; font-size:12px; font-weight:500; padding:5px 11px; }
      .il-chip-toggle.on { background:var(--ink); border-color:var(--ink); color:#fff; }
      .il-chip-pr { background:var(--gold-bg); color:var(--gold-ink); border:1px solid #E4CB84; }
      .il-chip-rep { background:var(--teal-bg); color:var(--teal-ink); border:1px solid #9BD8CF; }

      .il-livebar { position:sticky; top:58px; z-index:4; background:var(--ink); color:#fff;
        border-radius:12px; padding:12px 16px; margin-bottom:14px; }
      .il-livebar-main { display:flex; justify-content:space-between; align-items:center; gap:10px; }
      .il-livebar-left { flex:1; min-width:0; }
      .il-livebar-name { font-family:'Barlow Condensed',sans-serif; font-weight:600; letter-spacing:.08em;
        text-transform:uppercase; font-size:17px; background:transparent; border:none; color:#fff;
        width:100%; padding:0; border-bottom:1.5px dashed rgba(255,255,255,.25); border-radius:0; }
      .il-livebar-vol { font-size:12px; color:#B8C4CD; margin-top:3px; }
      .il-clock { font-size:26px; font-weight:600; white-space:nowrap; }
      .il-restrow { display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        border-top:1px solid rgba(255,255,255,.15); margin-top:10px; padding-top:10px; }
      .il-restrow.over { color:#FFD98E; font-weight:600; }
      .il-restlabel { font-size:13px; }
      .il-resttime { font-size:18px; font-weight:600; }
      .il-restbtn { background:rgba(255,255,255,.12); color:#fff; border:none; border-radius:8px;
        padding:4px 10px; font-size:12px; cursor:pointer; }
      .il-restbtn:hover { background:rgba(255,255,255,.22); }
      .il-restbar-track { flex-basis:100%; height:4px; background:rgba(255,255,255,.15);
        border-radius:2px; overflow:hidden; }
      .il-restbar { display:block; height:100%; background:var(--clip); border-radius:2px;
        transition:width .4s linear; }
      @media (prefers-reduced-motion: reduce) { .il-restbar { transition:none; } }

      .il-exhead { display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .il-exhead-left { display:flex; align-items:center; gap:9px; min-width:0; flex-wrap:wrap; }
      .il-exhead-left h3 { margin:0; }
      .il-exicon { flex:none; color:var(--muted); }
      .il-exremove { padding:4px 10px; border:none; }
      .il-restcfg { display:flex; align-items:center; gap:8px; margin:4px 0 2px; }
      .il-stepbtn { width:28px; height:28px; border-radius:8px; border:1.5px solid var(--line);
        background:var(--card); cursor:pointer; font-size:15px; line-height:1; color:var(--ink); }
      .il-stepbtn:hover { border-color:var(--ink); }
      .il-restval { font-size:13px; min-width:38px; text-align:center; }

      .il-setgrid { display:grid; grid-template-columns:30px 1fr 1fr 46px minmax(64px,auto);
        gap:8px; align-items:center; }
      .il-sethead { font-size:10.5px; letter-spacing:.1em; color:var(--muted); margin:10px 0 6px; }
      .il-unitbtn { background:transparent; border:none; padding:0; text-align:left; cursor:pointer;
        font-size:10.5px; letter-spacing:.1em; font-weight:700; color:var(--clip-dark); }
      .il-unitbtn:hover { text-decoration:underline; }
      .il-setrow { margin-bottom:8px; }
      .il-setrow.done .il-input { border-color:transparent; }
      .il-setnum { color:var(--muted); font-size:13px; text-align:center; }
      .il-check { width:100%; height:40px; border-radius:9px; border:1.5px solid var(--line);
        background:var(--card); cursor:pointer; font-size:18px; color:#fff; }
      .il-check.on { background:var(--clip); border-color:var(--clip); }
      .il-badgecell { display:flex; flex-direction:column; gap:3px; align-items:flex-start; }
      .il-badgecell .il-chip { animation:il-pop .25s ease-out; }
      @keyframes il-pop { from { transform:scale(.6); opacity:0; } to { transform:scale(1); opacity:1; } }
      @media (prefers-reduced-motion: reduce) { .il-badgecell .il-chip { animation:none; } }
      .il-notes { color:var(--muted); font-size:13px; font-style:italic; margin:0 0 4px; }
      .il-sessionnote { margin:4px 0 8px; font-size:13px; border-style:dashed; background:#FDFCF8; }
      .il-sessionnote::placeholder { color:var(--ghost); font-style:italic; }
      .il-sessionnote-line { margin:6px 0 0; font-size:13.5px; }
      .il-sessionnote-line strong { font-weight:600; }

      .il-chartcard { padding:14px 10px 8px; }
      .il-chartbar { display:flex; justify-content:space-between; align-items:center; gap:10px;
        flex-wrap:wrap; padding:0 4px 10px; }
      .il-tabs { display:flex; background:var(--paper); border-radius:10px; padding:3px; gap:2px; }
      .il-tab { border:none; background:transparent; padding:6px 12px; border-radius:8px;
        font-size:13px; color:var(--muted); cursor:pointer; }
      .il-tab.on { background:var(--ink); color:#fff; font-weight:600; }
      .il-chartnote { text-align:center; padding-bottom:6px; }
      .il-chartwrap { width:100%; }

      .il-exlist { display:flex; align-items:center; gap:11px; }
      .il-exlist-info { display:flex; flex-direction:column; gap:1px; flex:1; min-width:0; }
      .il-exlist-info .il-muted { font-size:12.5px; }

      .il-overlay { position:fixed; inset:0; background:rgba(23,34,43,.5); display:grid;
        place-items:center; z-index:20; padding:20px; }
      .il-dialog { background:var(--card); border-radius:14px; padding:20px; max-width:360px; width:100%;
        border:1.5px solid var(--line); }
      .il-dialog p { margin:0 0 6px; }

      .il-statrow { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:12px 0 18px; }
      .il-stat { background:var(--card); border:1.5px solid var(--line); border-radius:12px;
        padding:12px 8px; text-align:center; }
      .il-stat-v { font-size:18px; font-weight:600; }
      .il-stat-l { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-top:3px; }
      .il-summary-date { margin:-6px 0 10px; }
      .il-prbox { border-color:#E4CB84; background:#FFFBF0; }
      .il-prline { display:flex; align-items:center; gap:10px; margin-top:8px; font-size:14px; }
      .il-musrow { display:grid; grid-template-columns:92px 1fr auto; gap:10px; align-items:center; margin-top:9px; }
      .il-muslabel { font-size:13px; }
      .il-musbar-track { background:var(--paper); border-radius:6px; height:14px; overflow:hidden; }
      .il-musbar { height:100%; background:var(--clip); border-radius:6px; }
      .il-musval { font-size:12px; color:var(--muted); white-space:nowrap; }

      @media (max-width:430px) {
        .il-setgrid { grid-template-columns:24px 1fr 1fr 42px minmax(58px,auto); gap:6px; }
        .il-clock { font-size:22px; }
        .il-exopts { gap:10px; }
      }
    `}</style>
  );
}
