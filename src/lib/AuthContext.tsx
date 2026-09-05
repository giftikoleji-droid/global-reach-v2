import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { db, type Profile } from "./aetheris";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    pass: string,
    refCode?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    try {
      const prof = await db.getProfile(userId);
      setProfile(prof);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }

  useEffect(() => {
    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to real-time auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
    }
  }

  async function signup(name: string, email: string, pass: string, refCode?: string) {
    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: pass,
        options: {
          data: {
            name: trimmedName,
            full_name: trimmedName,
            referred_by: refCode?.trim() || null,
          },
        },
      });

      if (error) return { success: false, error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
