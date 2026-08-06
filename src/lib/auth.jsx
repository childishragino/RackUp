import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = signed out
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session ? session.user : null,
    loading: session === undefined,
    authError,
    // Sends a 6-digit code to `email`. `shouldCreateUser` lets first-time
    // sign-in double as sign-up — RackUp has no separate registration flow.
    requestCode: async (email) => {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) setAuthError(error.message);
      return !error;
    },
    verifyCode: async (email, token) => {
      setAuthError(null);
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) setAuthError(error.message);
      return !error;
    },
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
