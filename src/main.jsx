import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/auth";
import { isConfigured } from "./lib/supabaseClient";
import App from "./App";

function ConfigNotice() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F1F4F6", color: "#17222B", fontFamily: "system-ui", padding: 20 }}>
      <div style={{ maxWidth: 420, background: "#fff", border: "1.5px solid #D9E0E6", borderRadius: 14, padding: 24 }}>
        <h1 style={{ fontSize: 20, margin: "0 0 10px" }}>RackUp isn't configured yet</h1>
        <p style={{ margin: 0, color: "#5C6B77", fontSize: 14, lineHeight: 1.5 }}>
          Copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase project's
          URL and anon key (see README → Supabase setup), then restart the dev server.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <ConfigNotice />
    )}
  </React.StrictMode>
);
