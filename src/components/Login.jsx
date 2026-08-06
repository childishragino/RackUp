import React, { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { requestCode, verifyCode, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email"); // 'email' | 'code'
  const [busy, setBusy] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    const ok = await requestCode(email.trim());
    setBusy(false);
    if (ok) setStage("code");
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    await verifyCode(email.trim(), code.trim());
    setBusy(false);
  };

  return (
    <div className="il-authwrap">
      <div className="il-authcard">
        <div className="il-authbrand"><span className="il-plate" aria-hidden="true" />RACKUP</div>
        {stage === "email" ? (
          <>
            <p className="il-authsub">Sign in with your email — we'll send a 6-digit code, no password needed.</p>
            <form onSubmit={sendCode}>
              <label className="il-label" htmlFor="email">Email</label>
              <input id="email" className="il-input" type="email" inputMode="email" autoFocus
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="il-btnrow">
                <button className="il-primary il-wide" type="submit" disabled={busy || !email.trim()}>
                  {busy ? "Sending…" : "Send code"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="il-authsub">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
            <form onSubmit={submitCode}>
              <label className="il-label" htmlFor="code">Code</label>
              <input id="code" className="il-input il-codeinput" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} autoFocus placeholder="000000" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              <div className="il-btnrow">
                <button className="il-ghost" type="button" onClick={() => { setStage("email"); setCode(""); }}>Back</button>
                <button className="il-primary il-wide" type="submit" disabled={busy || code.length !== 6}>
                  {busy ? "Verifying…" : "Verify & sign in"}
                </button>
              </div>
            </form>
          </>
        )}
        {authError && <p className="il-autherr">{authError}</p>}
      </div>
    </div>
  );
}
