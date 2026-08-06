import React from "react";
import { TERMS, PRIVACY, LEGAL_EFFECTIVE, LEGAL_VERSION } from "../lib/legal";

const DOCS = { terms: TERMS, privacy: PRIVACY };

/** Renders one legal document. `which` is "terms" | "privacy". */
export function LegalBody({ which }) {
  const doc = DOCS[which];
  if (!doc) return null;
  return (
    <div className="il-legal">
      <h2 className="il-legal-title">{doc.title}</h2>
      <p className="il-legal-meta">Version {LEGAL_VERSION} · Effective {LEGAL_EFFECTIVE}</p>
      {doc.sections.map((s) => (
        <section key={s.h} className={`il-legal-sec ${s.isImportant ? "important" : ""}`}>
          <h3 className="il-legal-h">{s.h}</h3>
          {s.p.map((t, i) => <p key={i} className="il-legal-p">{t}</p>)}
        </section>
      ))}
    </div>
  );
}

/** Full-screen modal wrapper used by the sign-in screen and Settings. */
export default function LegalModal({ which, onClose }) {
  if (!which) return null;
  return (
    <div className="il-overlay" role="dialog" aria-modal="true" aria-label={DOCS[which]?.title}>
      <div className="il-legal-modal">
        <div className="il-legal-scroll">
          <LegalBody which={which} />
        </div>
        <div className="il-btnrow il-legal-foot">
          <button className="il-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
