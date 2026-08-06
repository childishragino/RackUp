import React from "react";
import Style from "./components/Style";
import Login from "./components/Login";
import RackUp from "./RackUp";
import { useAuth } from "./lib/auth";

export default function App() {
  const { user, loading } = useAuth();

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
