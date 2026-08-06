import React, { useEffect } from "react";
import Style from "./components/Style";
import Login from "./components/Login";
import RackUp from "./RackUp";
import { useAuth } from "./lib/auth";
import { recordConsent } from "./lib/db";
import { LEGAL_VERSION } from "./lib/legal";

export default function App() {
  const { user, loading } = useAuth();

  // Stamp the accepted legal version once a session exists. Best-effort: a
  // failure here must never block the user from reaching their workouts.
  useEffect(() => {
    if (!user) return;
    recordConsent(user.id, LEGAL_VERSION).catch(() => {});
  }, [user]);

  return (
    <div className="il-root">
      <Style />
      {loading ? (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#5C6B77", fontFamily: "system-ui" }}>
          Loading…
        </div>
      ) : user ? (
        <RackUp userId={user.id} userEmail={user.email} />
      ) : (
        <Login />
      )}
    </div>
  );
}
