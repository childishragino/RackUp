import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { regenerateHealthToken } from "../lib/db";
import LegalModal from "./LegalDoc";
import { LEGAL_VERSION, LEGAL_EFFECTIVE } from "../lib/legal";

export const HEALTH_TOKEN_HEADER = "X-RackUp-Token";

export default function Settings({ userId, onBack, onOpenImport }) {
  const { user, signOut } = useAuth();
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [showDoc, setShowDoc] = useState(null);

  const webhookUrl = `${window.location.origin}/api/health-import`;

  const generate = async () => {
    setBusy(true);
    try {
      const t = await regenerateHealthToken(userId);
      setToken(t);
    } finally {
      setBusy(false);
      setConfirmRegen(false);
    }
  };

  return (
    <main className="il-main">
      <button className="il-ghost il-back" onClick={onBack}>← Back</button>
      <div className="il-sechead"><h2>Settings</h2></div>

      <section className="il-card">
        <h3>Account</h3>
        <p className="il-muted">Signed in as {user?.email}</p>
        <div className="il-btnrow">
          <button className="il-ghost il-danger" onClick={signOut}>Sign out</button>
        </div>
      </section>

      <section className="il-card">
        <h3>Heart-rate sync</h3>
        <p className="il-muted">
          Install <strong>Health Auto Export</strong> on your iPhone and set up an automation that
          POSTs Heart Rate, Steps, Distance and Active Energy to the URL below every 30 minutes,
          with the token as a header named <code>{HEALTH_TOKEN_HEADER}</code>.
        </p>
        <div className="il-urlbox">{webhookUrl}</div>

        {token ? (
          <>
            <p className="il-muted" style={{ marginTop: 10 }}>
              Copy this token now — it won't be shown again (only its hash is stored).
            </p>
            <div className="il-tokenbox">{token}</div>
          </>
        ) : (
          <p className="il-muted" style={{ marginTop: 10 }}>No token generated yet.</p>
        )}

        <div className="il-btnrow">
          {confirmRegen ? (
            <>
              <button className="il-ghost" onClick={() => setConfirmRegen(false)}>Cancel</button>
              <button className="il-primary" disabled={busy} onClick={generate}>
                {busy ? "Generating…" : "Confirm regenerate"}
              </button>
            </>
          ) : (
            <button className="il-primary" disabled={busy}
              onClick={() => (token !== null ? setConfirmRegen(true) : generate())}>
              {token ? "Regenerate token" : "Generate token"}
            </button>
          )}
        </div>
      </section>

      <section className="il-card">
        <h3>Data</h3>
        <p className="il-muted">Bring over routines and sessions saved by the old prototype.</p>
        <div className="il-btnrow">
          <button className="il-ghost" onClick={onOpenImport}>Import old data</button>
        </div>
      </section>

      <section className="il-card">
        <h3>Legal</h3>
        <p className="il-muted">
          You accepted version {LEGAL_VERSION} (effective {LEGAL_EFFECTIVE}).
        </p>
        <div className="il-btnrow">
          <button className="il-ghost" onClick={() => setShowDoc("privacy")}>Privacy Policy</button>
          <button className="il-ghost" onClick={() => setShowDoc("terms")}>Terms of Service</button>
        </div>
      </section>

      <LegalModal which={showDoc} onClose={() => setShowDoc(null)} />
    </main>
  );
}
