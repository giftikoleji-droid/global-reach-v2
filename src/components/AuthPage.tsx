import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import { COMPANY, db, generateRefCode, localStore, type Profile } from "../lib/aetheris";

export function AuthPage({
  initialView = "login",
  onSuccess,
}: {
  initialView?: "login" | "signup";
  onSuccess?: () => void;
}) {
  const { session, profile: authProfile } = useAuth();
  const [view, setView] = useState<"login" | "signup">(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

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
    if ((session || authProfile) && onSuccess) {
      onSuccess();
    }
  }, [session, authProfile, onSuccess]);

  useEffect(() => {
    setMsg(null);
  }, [view]);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setMsg(null);
    try {
      const redirectUrl = typeof window !== "undefined" ? window.location.origin : "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        setMsg({ text: error.message || "Failed to sign in with Google.", type: "error" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMsg({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEmailPasswordLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMsg({ text: "Please enter your email and password.", type: "error" });
      return;
    }
    setIsLoading(true);
    setMsg(null);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        // Auth must only come from Supabase — no localStorage fallback
        setMsg({ text: error.message || "Invalid login credentials.", type: "error" });
        return;
      }

      const user = authData.user;
      if (user) {
        const meta = user.user_metadata as Record<string, unknown> | undefined;
        const metaName = meta ? meta["name"] : undefined;
        const metaFullName = meta ? meta["full_name"] : undefined;
        const metaRefCode = meta ? meta["ref_code"] : undefined;
        const fetched = await db.getProfile(user.id);
        const profile: Profile = fetched || {
          id: user.id,
          name:
            (typeof metaName === "string" && metaName) ||
            (typeof metaFullName === "string" && metaFullName) ||
            trimmedEmail.split("@")[0] ||
            "Client",
          email: trimmedEmail,
          role: (COMPANY.adminEmails as readonly string[]).includes(trimmedEmail.toLowerCase())
            ? "admin"
            : "client",
          ref_code:
            (typeof metaRefCode === "string" && metaRefCode) || generateRefCode(trimmedEmail),
          bonus_earned: 0,
        };
        await db.saveProfile(profile);
        setMsg({ text: "Login successful. Redirecting...", type: "success" });
        setTimeout(() => {
          onSuccess?.();
          if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
            window.history.pushState({}, "", "/dashboard");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        }, 300);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMsg({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEmailPasswordSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setMsg({ text: "Please fill in all required fields.", type: "error" });
      return;
    }
    if (password.length < 8) {
      setMsg({ text: "Password must be at least 8 characters long.", type: "error" });
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }
    if (!agreedToTerms) {
      setMsg({ text: "You must agree to the Terms of Service and Privacy Policy.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMsg(null);
    let userId = "usr_" + Math.random().toString(36).substring(2, 9);
    const generatedCode = generateRefCode(trimmedEmail);

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            full_name: trimmedName,
            ref_code: generatedCode,
            ...(refCode ? { referred_by: refCode } : {}),
          },
        },
      });

      if (authErr) {
        setMsg({ text: authErr.message, type: "error" });
        setIsLoading(false);
        return;
      }

      if (authData?.user?.id) {
        userId = authData.user.id;
      }

      if (authData?.user && !authData?.session) {
        setIsLoading(false);
        setMsg({
          text: "Account created! Please check your email to confirm your account before logging in.",
          type: "info",
        });
        return;
      }
    } catch {
      // Fall through to profile creation below when session is available
    }

    const newProfile: Profile = {
      id: userId,
      name: trimmedName,
      email: trimmedEmail,
      role: (COMPANY.adminEmails as readonly string[]).includes(trimmedEmail.toLowerCase())
        ? "admin"
        : "client",
      ref_code: generatedCode,
      ...(refCode ? { referred_by: refCode } : {}),
      bonus_earned: 0,
    };

    if (refCode) {
      localStore.recordReferral(refCode, userId);
    }
    await db.saveProfile(newProfile);
    setIsLoading(false);
    setMsg({ text: "Account created successfully. Accessing client portal...", type: "success" });
    setTimeout(() => {
      onSuccess?.();
      if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
        window.history.pushState({}, "", "/dashboard");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }, 400);
  }

  async function handleMagicLinkSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMsg({
        text: "Please enter your email address in the field above to receive a secure link.",
        type: "error",
      });
      return;
    }
    setIsLoading(true);
    setMsg(null);
    try {
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectUrl,
          ...(refCode ? { data: { referred_by: refCode } } : {}),
        },
      });
      if (error) {
        setMsg({ text: error.message || "Failed to send magic link.", type: "error" });
      } else {
        setLinkSent(true);
        setMsg({ text: "Secure login link sent to your email.", type: "success" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMsg({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasswordReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setMsg({ text: "Please enter your email address for password reset.", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const redirectUrl =
        typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });
      if (error) {
        setMsg({ text: error.message || "Failed to send password reset email.", type: "error" });
      } else {
        setMsg({ text: "Password reset instructions sent to your email.", type: "success" });
        setShowResetModal(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMsg({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0a192f",
        backgroundImage:
          "radial-gradient(ellipse at 50% 20%, rgba(13, 37, 69, 0.7) 0%, #0a192f 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)",
          boxSizing: "border-box",
          color: "#1e293b",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#0a192f",
              color: "#f5c518",
              fontSize: "22px",
              fontWeight: 700,
              marginBottom: "12px",
              border: "1px solid rgba(245, 197, 24, 0.3)",
            }}
          >
            Æ
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#0a192f", margin: "0 0 4px 0" }}>
            Aetheris Capital
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: 500 }}>
            {view === "login" ? "Log in to your account" : "Create your institutional account"}
          </p>
        </div>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px",
              backgroundColor:
                msg.type === "error" ? "#fef2f2" : msg.type === "success" ? "#f0fdf4" : "#eff6ff",
              color: msg.type === "error" ? "#991b1b" : msg.type === "success" ? "#166534" : "#1e40af",
              border: `1px solid ${
                msg.type === "error" ? "#fecaca" : msg.type === "success" ? "#bbf7d0" : "#bfdbfe"
              }`,
            }}
          >
            {msg.text}
          </div>
        )}

        {linkSent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0a192f", marginBottom: 8 }}>
              Check your email
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>
              We've sent a secure login link to <strong>{email}</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setLinkSent(false);
                setMsg(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Use a different email address or method
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1f2937",
                cursor: "pointer",
              }}
            >
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", margin: "18px 0" }}>
              <div style={{ flex: 1, borderBottom: "1px solid #e2e8f0" }} />
              <span style={{ padding: "0 12px", fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>OR</span>
              <div style={{ flex: 1, borderBottom: "1px solid #e2e8f0" }} />
            </div>

            <form onSubmit={view === "login" ? handleEmailPasswordLogin : handleEmailPasswordSignup}>
              {view === "signup" && (
                <div style={{ marginBottom: "14px" }}>
                  <label htmlFor="ap-name" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                    Full Name
                  </label>
                  <input
                    id="ap-name"
                    type="text"
                    required
                    placeholder="e.g. Fiona O'Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="ap-email" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                  Email
                </label>
                <input
                  id="ap-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="ap-password" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                  Password
                </label>
                <input
                  id="ap-password"
                  type="password"
                  required
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                />
              </div>

              {view === "signup" && (
                <div style={{ marginBottom: "14px" }}>
                  <label htmlFor="ap-confirm" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                    Confirm Password
                  </label>
                  <input
                    id="ap-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#0a192f",
                  color: "#f5c518",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Processing…" : view === "login" ? "Log In" : "Create Account"}
              </button>
            </form>

            {view === "login" && (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleMagicLinkSignIn()}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    padding: 11,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "transparent",
                    color: "#0a192f",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Email me a Secure Login Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowResetModal(true);
                  }}
                  style={{
                    display: "block",
                    margin: "12px auto 0",
                    border: 0,
                    background: "transparent",
                    color: "#64748b",
                    fontSize: 12,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Forgot password?
                </button>
              </>
            )}

            <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#64748b" }}>
              {view === "login" ? (
                <>
                  No account?{" "}
                  <button type="button" onClick={() => setView("signup")} style={{ border: 0, background: "transparent", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}>
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button type="button" onClick={() => setView("login")} style={{ border: 0, background: "transparent", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}>
                    Log in
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {showResetModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,25,47,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 50,
            }}
          >
            <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: "0 0 8px", color: "#0a192f" }}>Reset password</h3>
              <form onSubmit={handlePasswordReset}>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 10 }}
                />
                <button type="submit" disabled={isLoading} style={{ width: "100%", padding: 11, borderRadius: 8, border: 0, background: "#0a192f", color: "#f5c518", fontWeight: 700 }}>
                  {isLoading ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={() => setShowResetModal(false)} style={{ width: "100%", marginTop: 8, padding: 10, border: 0, background: "transparent", color: "#64748b" }}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
