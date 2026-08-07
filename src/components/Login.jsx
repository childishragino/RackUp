import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import LegalModal from "./LegalDoc";

export default function Login() {
  const { requestCode, verifyCode, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email"); // 'email' | 'code'
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showDoc, setShowDoc] = useState(null); // 'terms' | 'privacy' | null

  const sendCode = async (e) => {
    e.preventDefault();
    // Consent is required every time: sign-in and sign-up share one flow, so we
    // cannot tell in advance whether this address is a new account.
    if (!email.trim() || !agreed || busy) return;
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
            <p className="il-authsub">Sign in with your email — we'll send you a link to tap. No password needed.</p>

            <div className="il-healthnote" role="note">
              <strong>Before you start:</strong> RackUp is a logging tool, not a medical device, and
              gives no medical advice. Exercise carries risk of injury. Talk to a physician before
              starting a programme, and stop if you feel unwell.
            </div>

            <form onSubmit={sendCode}>
              <label className="il-label" htmlFor="email">Email</label>
              <input id="email" className="il-input" type="email" inputMode="email" autoFocus
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label className="il-consent">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>
                  I'm 16 or older and I agree to the{" "}
                  <button type="button" className="il-linkbtn" onClick={() => setShowDoc("terms")}>Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" className="il-linkbtn" onClick={() => setShowDoc("privacy")}>Privacy Policy</button>,
                  including the storage of my workout and health data.
                </span>
              </label>

              <div className="il-btnrow">
                <button className="il-primary il-wide" type="submit" disabled={busy || !email.trim() || !agreed}>
                  {busy ? "Sending…" : "Send code"}
                </button>
              </div>
              {!agreed && email.trim() !== "" && (
                <p className="il-muted il-consenthint">Tick the box above to continue.</p>
              )}
            </form>
          </>
        ) : (
          <>
            <p className="il-authsub">
              We've emailed <strong>{email}</strong>. Open it and <strong>tap the sign-in link</strong> — that's all
              you need to do.
            </p>
            <p className="il-muted il-altcode">
              If your email shows a <strong>6-digit code</strong> instead of a link, type it here:
            </p>
            <form onSubmit={submitCode}>
              <label className="il-label il-sronly" htmlFor="code">Code</label>
              <input id="code" className="il-input il-codeinput" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="000000" value={code}
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

        <p className="il-legal-links">
          <button type="button" className="il-linkbtn" onClick={() => setShowDoc("terms")}>Terms</button>
          <span aria-hidden="true"> · </span>
          <button type="button" className="il-linkbtn" onClick={() => setShowDoc("privacy")}>Privacy</button>
        </p>
      </div>

      <LegalModal which={showDoc} onClose={() => setShowDoc(null)} />
    </div>
  );
}
