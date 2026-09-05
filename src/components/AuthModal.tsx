import { useEffect, useState, type FormEvent } from "react";
import { COMPANY, db, generateRefCode, localStore, type Profile } from "../lib/aetheris";
import { supabase } from "../lib/supabase";

type View = "signup" | "login";
type Msg = { text: string; type: "error" | "success" | "info" } | null;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthModal({
  open,
  view: _view,
  onView: _onView,
  onClose,
  onSuccess,
}: {
  open: boolean;
  view: View;
  onView: (v: View) => void;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
}) {
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    const stored = sessionStorage.getItem("referral_code");
    const ref = fromUrl ?? stored ?? "";
    if (ref) {
      sessionStorage.setItem("referral_code", ref);
      setRefCode(ref);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setLinkSent(false);
    setShowReset(false);
  }, [open]);

  function goDashboard(profile: Profile) {
    onSuccess(profile);
    onClose();
    if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  function buildProfile(userId: string, userEmail: string, metadata?: Record<string, any>): Profile {
    const normalized = userEmail.trim().toLowerCase();
    return {
      id: userId,
      name: metadata?.name || metadata?.full_name || normalized.split("@")[0] || "Client",
      email: normalized,
      role: (COMPANY.adminEmails as readonly string[]).includes(normalized) ? "admin" : "client",
      ref_code: metadata?.ref_code || generateRefCode(normalized),
      referred_by: refCode || null,
      bonus_earned: 0,
    };
  }

  async function finishSupabaseUser(userId: string, userEmail: string, metadata?: Record<string, any>) {
    const fetched = await db.getProfile(userId);
    const profile = fetched || buildProfile(userId, userEmail, metadata);
    await db.saveProfile(profile);
    localStore.setUser(profile);
    return profile;
  }

  async function handleContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setMsg({ text: "Please enter a valid email address.", type: "error" });
      return;
    }
    if (password.length < 8) {
      setMsg({ text: "Password must be at least 8 characters.", type: "error" });
      return;
    }

    setBusy(true);
    setMsg({ text: "Checking your account and securing your session…", type: "info" });

    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!loginError && loginData.user) {
        const profile = await finishSupabaseUser(loginData.user.id, normalizedEmail, loginData.user.user_metadata);
        setBusy(false);
        setMsg({ text: "Authentication successful. Entering your client portal…", type: "success" });
        setTimeout(() => goDashboard(profile), 250);
        return;
      }

      // Supabase does not expose a safe client-side email-existence lookup.
      // Trying signup after a failed login lets Supabase decide whether the
      // address is new without ever handling a password outside Supabase.
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: normalizedEmail.split("@")[0] || "Client",
            full_name: normalizedEmail.split("@")[0] || "Client",
            ref_code: generateRefCode(normalizedEmail),
            referred_by: refCode || undefined,
          },
        },
      });

      if (signupError) {
        const message = signupError.message.toLowerCase();
        if (message.includes("already registered") || message.includes("already been registered") || message.includes("user already exists")) {
          setMsg({ text: "This email is already registered, but the password was not accepted. Please check your password or use the secure login link / reset option.", type: "error" });
        } else {
          setMsg({ text: signupError.message || "We could not complete authentication.", type: "error" });
        }
        setBusy(false);
        return;
      }

      if (signupData.user && !signupData.session) {
        setBusy(false);
        setMsg({ text: "Account created. Please check your email to confirm your account, then return here to continue.", type: "info" });
        return;
      }

      if (signupData.user) {
        const profile = await finishSupabaseUser(signupData.user.id, normalizedEmail, signupData.user.user_metadata);
        if (refCode) localStore.recordReferral(refCode, signupData.user.id);
        setBusy(false);
        setMsg({ text: "Account created successfully. Entering your client portal…", type: "success" });
        setTimeout(() => goDashboard(profile), 250);
        return;
      }

      throw loginError || new Error("Authentication could not be completed.");
    } catch (err: any) {
      console.error("Unified authentication failed:", err);
      setMsg({ text: err?.message || "We could not complete authentication. Please check your connection and try again.", type: "error" });
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setMsg(null);
    try {
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl, queryParams: { prompt: "select_account" } },
      });
      if (error) setMsg({ text: error.message || "Failed to sign in with Google.", type: "error" });
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setMsg({ text: "Please enter a valid email address first.", type: "error" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: redirectUrl, data: refCode ? { referred_by: refCode } : undefined },
      });
      if (error) {
        setMsg({ text: error.message || "Failed to send secure login link.", type: "error" });
      } else {
        setLinkSent(true);
        setMsg({ text: "Secure login link sent to your email.", type: "success" });
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const targetEmail = resetEmail.trim().toLowerCase() || email.trim().toLowerCase();
    if (!isValidEmail(targetEmail)) {
      setMsg({ text: "Please enter a valid email address for password reset.", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo: redirectUrl });
      if (error) setMsg({ text: error.message || "Failed to send reset email.", type: "error" });
      else {
        setMsg({ text: "Password reset link sent to your email.", type: "success" });
        setShowReset(false);
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(10,10,15,.86)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 10000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="auth-modal-card" style={{ position: "relative", width: "100%", maxWidth: 430, maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box", padding: "32px 28px", borderRadius: 16, background: "#0A0A0F", border: "1px solid rgba(212,175,55,.35)", color: "#F8FAFC", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{ position: "absolute", right: 14, top: 12, border: 0, background: "transparent", color: "#94A3B8", fontSize: 26, cursor: "pointer" }}>×</button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 10px", display: "grid", placeItems: "center", borderRadius: 12, background: "#111827", border: "1px solid rgba(212,175,55,.55)", color: "#D4AF37", fontFamily: "Georgia,serif", fontWeight: 700, fontSize: 21 }}>Æ</div>
          <h2 style={{ margin: 0, color: "#F8FAFC", fontFamily: "'Playfair Display',Georgia,serif", fontSize: 24 }}>Welcome to Aetheris Capital</h2>
          <p style={{ margin: "7px 0 0", color: "#94A3B8", fontSize: 13 }}>Enter your email and password to continue. We'll automatically sign you in or create your account.</p>
        </div>

        {msg && <div style={{ marginBottom: 15, padding: "10px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.45, background: msg.type === "error" ? "rgba(239,68,68,.10)" : msg.type === "success" ? "rgba(16,185,129,.10)" : "rgba(212,175,55,.09)", border: `1px solid ${msg.type === "error" ? "rgba(239,68,68,.35)" : msg.type === "success" ? "rgba(16,185,129,.35)" : "rgba(212,175,55,.3)"}`, color: msg.type === "error" ? "#FCA5A5" : msg.type === "success" ? "#A7F3D0" : "#FDE68A" }}>{msg.text}</div>}

        {linkSent ? (
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>✉️</div>
            <p style={{ color: "#E5E7EB", fontSize: 13, lineHeight: 1.5 }}>Check your email for the secure login link.</p>
            <button type="button" onClick={() => setLinkSent(false)} style={{ marginTop: 6, background: "transparent", border: 0, color: "#D4AF37", cursor: "pointer" }}>Back to email and password</button>
          </div>
        ) : (
          <>
            <form onSubmit={handleContinue}>
              <label htmlFor="unified-email" style={{ display: "block", marginBottom: 6, color: "#CBD5E1", fontSize: 12, fontWeight: 700 }}>Email</label>
              <input id="unified-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", marginBottom: 13, borderRadius: 9, border: "1px solid #374151", background: "#111827", color: "#F8FAFC", outline: "none" }} />

              <label htmlFor="unified-password" style={{ display: "block", marginBottom: 6, color: "#CBD5E1", fontSize: 12, fontWeight: 700 }}>Password</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input id="unified-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required style={{ width: "100%", boxSizing: "border-box", padding: "12px 82px 12px 13px", borderRadius: 9, border: "1px solid #374151", background: "#111827", color: "#F8FAFC", outline: "none" }} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", right: 8, top: 7, padding: "6px 8px", border: 0, background: "transparent", color: "#D4AF37", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{showPassword ? "Hide" : "Show"}</button>
              </div>

              <button type="submit" disabled={busy} style={{ width: "100%", padding: 12, borderRadius: 9, border: "1px solid #D4AF37", background: "#D4AF37", color: "#0A0A0F", fontWeight: 800, cursor: busy ? "wait" : "pointer", opacity: busy ? .7 : 1 }}>{busy ? "Processing…" : "Continue"}</button>
            </form>

            <button type="button" disabled={busy} onClick={() => void handleMagicLink()} style={{ width: "100%", marginTop: 10, padding: 11, borderRadius: 9, border: "1px solid rgba(212,175,55,.4)", background: "transparent", color: "#D4AF37", fontWeight: 700, cursor: "pointer" }}>Send me a Secure Login Link</button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: "#64748B", fontSize: 11 }}><span style={{ height: 1, flex: 1, background: "#374151" }} />OR<span style={{ height: 1, flex: 1, background: "#374151" }} /></div>

            <button type="button" disabled={busy} onClick={() => void handleGoogleSignIn()} style={{ width: "100%", padding: 11, borderRadius: 9, border: "1px solid #374151", background: "#111827", color: "#F8FAFC", fontWeight: 700, cursor: "pointer" }}>Continue with Google</button>

            <button type="button" onClick={() => { setResetEmail(email); setShowReset(true); }} style={{ display: "block", margin: "15px auto 0", border: 0, background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>Forgot password?</button>
          </>
        )}

        {showReset && (
          <div style={{ position: "absolute", inset: 0, padding: 24, background: "#0A0A0F", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%" }}>
              <h3 style={{ fontFamily: "'Playfair Display',Georgia,serif", margin: "0 0 8px", color: "#F8FAFC" }}>Reset your password</h3>
              <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.5 }}>We'll send a secure password-reset link to your email.</p>
              <form onSubmit={handlePasswordReset}>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" required style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 9, border: "1px solid #374151", background: "#111827", color: "#F8FAFC" }} />
                <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 10, padding: 11, borderRadius: 9, border: "1px solid #D4AF37", background: "#D4AF37", color: "#0A0A0F", fontWeight: 800 }}>{busy ? "Sending…" : "Send Reset Link"}</button>
                <button type="button" onClick={() => setShowReset(false)} style={{ width: "100%", marginTop: 8, padding: 10, border: 0, background: "transparent", color: "#94A3B8" }}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
