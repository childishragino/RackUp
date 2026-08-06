import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  MUSCLES, SUPERSETS, uid, toLbs, convertW, detectExercise,
  finalizeTotals, buildRecords, lastEntryFor, buildEntry,
  fmtVol, fmtClock, fmtDate, fmtShort,
} from "./lib/workout";
import { loadAll, saveRoutine, deleteRoutine, insertSession, mergeHeartRateIfNeeded } from "./lib/db";
import Settings from "./components/Settings";
import Import from "./components/Import";

/* ------------------------------------------------------------------ */
/*  RackUp — ported from the workout-logger.jsx prototype (v3).        */
/*  UI, logic and design are unchanged; persistence now goes through   */
/*  Supabase (src/lib/db.js) instead of window.storage.                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */

export default function RackUp({ userId, userEmail, onSignOut }) {
  const [data, setData] = useState(null);
  const [view, setView] = useState({ name: "home" });
  const [saveState, setSaveState] = useState("idle");
  const [confirm, setConfirm] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await loadAll());
      } catch (e) {
        setLoadError(e.message || "Failed to load your data.");
      }
    })();
  }, [userId]);

  const withSaveState = async (fn) => {
    try {
      setSaveState("saving");
      const result = await fn();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
      return result;
    } catch (e) {
      setSaveState("error");
      throw e;
    }
  };

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F1F4F6", color: "#5C6B77", fontFamily: "system-ui", padding: 20, textAlign: "center" }}>
        Couldn't load your data: {loadError}
      </div>
    );
  }

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

  const updateSessionInData = (updated) =>
    setData((d) => ({ ...d, sessions: d.sessions.map((s) => (s.id === updated.id ? updated : s)) }));

  return (
    <>
      <header className="il-top">
        <button className="il-brand" onClick={() => setView({ name: "home" })}>
          <span className="il-plate" aria-hidden="true" />RACKUP
        </button>
        <div className="il-topright">
          <span className={`il-save il-save-${saveState}`}>
            {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "error" ? "not saved" : ""}
          </span>
          <button className="il-navlink" onClick={() => setView({ name: "settings" })}>Settings</button>
        </div>
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
                onYes: async () => {
                  await withSaveState(() => deleteRoutine(routine.id));
                  setData((d) => ({ ...d, routines: d.routines.filter((x) => x.id !== routine.id) }));
                  setView({ name: "home" });
                },
              })
            }
          />
        );
      })()}

      {view.name === "edit" && (
        <RoutineEditor
          routine={view.routine}
          onCancel={() => setView({ name: "home" })}
          onSave={async (r) => {
            const saved = await withSaveState(() => saveRoutine(r, userId));
            const exists = data.routines.some((x) => x.id === saved.id);
            setData((d) => ({ ...d, routines: exists ? d.routines.map((x) => (x.id === saved.id ? saved : x)) : [...d.routines, saved] }));
            setView({ name: "detail", routineId: saved.id });
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
            const finish = async (sess) => {
              const finished = finalizeTotals({ ...sess, endedAt: Date.now() });
              const saved = await withSaveState(() => insertSession(finished, userId));
              setData((d) => ({ ...d, sessions: [...d.sessions, saved] }));
              setView({ name: "summary", session: saved });
            };
            const anyDone = s.entries.some((e) => e.sets.some((x) => x.done));
            if (!anyDone) setConfirm({ msg: "No sets are marked done. End anyway?", yesLabel: "End workout", onYes: () => finish(s) });
            else finish(s);
          }}
        />
      )}

      {view.name === "summary" && (
        <Summary
          session={view.session}
          fromHistory={view.fromHistory}
          userId={userId}
          onSessionUpdated={updateSessionInData}
          onDone={() => setView({ name: "home" })}
        />
      )}

      {view.name === "settings" && (
        <Settings userId={userId} onBack={() => setView({ name: "home" })} onOpenImport={() => setView({ name: "import" })} />
      )}

      {view.name === "import" && (
        <Import
          userId={userId}
          onBack={() => setView({ name: "settings" })}
          onDone={async () => { setData(await loadAll()); setView({ name: "home" }); }}
        />
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
    </>
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
  const [saving, setSaving] = useState(false);
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
          disabled={saving || !r.name.trim() || r.exercises.length === 0 || r.exercises.some((e) => !e.name.trim())}
          onClick={async () => { setSaving(true); try { await onSave({ ...r, name: r.name.trim() }); } finally { setSaving(false); } }}>
          {saving ? "Saving…" : "Save routine"}
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
        prs = [...prs, { exercise: entry.name, kind: "weight", value: set.weight, unit, prev: convertW(String(Math.round(rec.maxLbs * 10) / 10), "lbs", unit) }];
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

function Summary({ session, onDone, fromHistory, userId, onSessionUpdated }) {
  const [sess, setSess] = useState(session);

  useEffect(() => {
    setSess(session);
    if (session.endedAt && session.avgHr == null) {
      mergeHeartRateIfNeeded(session, userId)
        .then((updated) => {
          if (updated !== session) {
            setSess(updated);
            onSessionUpdated && onSessionUpdated(updated);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const muscles = Object.entries(sess.byMuscle || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxV = muscles.length ? muscles[0][1] : 1;
  const dur = (sess.endedAt || sess.startedAt) - sess.startedAt;
  const setsDone = sess.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const waitingForHr = sess.endedAt && sess.avgHr == null && Date.now() - sess.endedAt < 2 * 3600 * 1000;
  const hrPoints = (sess.hrSeries || []).map((p) => ({ label: new Date(p.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }), bpm: p.bpm }));

  return (
    <main className="il-main">
      <div className="il-sechead"><h2>{fromHistory ? sess.name : "Session complete"}</h2></div>
      <p className="il-muted il-summary-date">{fmtDate(sess.startedAt)}</p>

      <div className="il-statrow">
        <div className="il-stat"><div className="il-stat-v il-num">{fmtClock(dur)}</div><div className="il-stat-l">Duration</div></div>
        <div className="il-stat"><div className="il-stat-v il-num">{fmtVol(sess.totalVolume || 0)}</div><div className="il-stat-l">Total moved</div></div>
        <div className="il-stat"><div className="il-stat-v il-num">{setsDone}</div><div className="il-stat-l">Sets done</div></div>
      </div>

      {sess.prs && sess.prs.length > 0 && (
        <section className="il-card il-prbox">
          <h3>Records set today</h3>
          {sess.prs.map((p, i) => (
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

      <section className="il-card">
        <h3>Heart rate</h3>
        {sess.avgHr != null ? (
          <>
            <div className="il-hrrow">
              <span className="il-chip il-chip-hr">{sess.avgHr} bpm avg</span>
              <span className="il-chip il-chip-hr">{sess.maxHr} bpm max</span>
            </div>
            {hrPoints.length > 1 && (
              <div className="il-chartwrap" style={{ marginTop: 10 }}>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={hrPoints} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Line type="monotone" dataKey="bpm" stroke="#C4441F" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : waitingForHr ? (
          <p className="il-hrwait">waiting for watch data…</p>
        ) : (
          <p className="il-muted">No heart-rate data for this session.</p>
        )}
      </section>

      {sess.entries.some((e) => e.sessionNote && e.sessionNote.trim()) && (
        <section className="il-card">
          <h3>Session notes</h3>
          {sess.entries.filter((e) => e.sessionNote && e.sessionNote.trim()).map((e, i) => (
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
