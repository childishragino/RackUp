import React, { useState } from "react";
import { importLegacyData } from "../lib/db";
import { migrate } from "../lib/workout";

/**
 * One-time import of the prototype's saved data (RACKUP-BUILD-SPEC.md §3):
 * paste the JSON blob that was under localStorage key `rackup:data` (or the
 * legacy `ironlog:data`) in the old artifact, and it's upserted into Supabase.
 */
export default function Import({ userId, onDone, onBack }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const run = async () => {
    setError(null);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError("That doesn't look like valid JSON.");
      return;
    }
    if (!parsed || (!Array.isArray(parsed.routines) && !Array.isArray(parsed.sessions))) {
      setError('Expected an object with "routines" and/or "sessions" arrays.');
      return;
    }
    setBusy(true);
    try {
      const migrated = migrate({ version: parsed.version, routines: parsed.routines || [], sessions: parsed.sessions || [] });
      const data = await importLegacyData(migrated, userId);
      setResult({ routines: data.routines.length, sessions: data.sessions.length });
    } catch (e) {
      setError(e.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="il-main">
      <button className="il-ghost il-back" onClick={onBack}>← Back</button>
      <div className="il-sechead"><h2>Import old data</h2></div>
      <p className="il-muted">
        Paste the JSON from the old prototype (browser devtools → Application → Local Storage →
        key <code>rackup:data</code>, or <code>ironlog:data</code> if it predates the rename).
      </p>
      <textarea className="il-textarea" placeholder='{"routines": [...], "sessions": [...]}'
        value={raw} onChange={(e) => setRaw(e.target.value)} />
      {error && <p className="il-autherr">{error}</p>}
      {result && (
        <p className="il-muted">Imported — you now have {result.routines} routine(s) and {result.sessions} session(s).</p>
      )}
      <div className="il-btnrow">
        <button className="il-ghost" onClick={onBack}>Cancel</button>
        {result ? (
          <button className="il-primary" onClick={onDone}>Done</button>
        ) : (
          <button className="il-primary" disabled={busy || !raw.trim()} onClick={run}>
            {busy ? "Importing…" : "Import"}
          </button>
        )}
      </div>
    </main>
  );
}
