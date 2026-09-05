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
  const [resetSent, setResetSent] = useState(false);
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

  // 1. Google OAuth
  async function handleGoogleSignIn() {
    setIsLoading(true);
    setMsg(null);
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) {
        setMsg({ text: error.message || "Failed to sign in with Google.", type: "error" });
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // 2. Email + Password Login
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
        // Check local fallback
        const existing = localStore.getUser();
        if (existing && existing.email.toLowerCase() === trimmedEmail.toLowerCase()) {
          onSuccess?.();
          return;
        }
        setMsg({ text: error.message || "Invalid login credentials.", type: "error" });
        return;
      }

      if (authData?.user) {
        const fetched = await db.getProfile(authData.user.id);
        const profile: Profile = fetched || {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || trimmedEmail.split("@")[0] || "Client",
          email: trimmedEmail,
          role: (COMPANY.adminEmails as readonly string[]).includes(trimmedEmail.toLowerCase()) ? "admin" : "client",
          ref_code: authData.user.user_metadata?.ref_code || generateRefCode(trimmedEmail),
          bonus_earned: 0,
        };
        await db.saveProfile(profile);
        localStore.setUser(profile);
        setMsg({ text: "Login successful. Redirecting...", type: "success" });
        setTimeout(() => {
          onSuccess?.();
          if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
            window.history.pushState({}, "", "/dashboard");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }
        }, 300);
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Sign Up with Email & Password
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
            referred_by: refCode || null,
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

      // If Supabase has email confirmation enabled and did not return a session
      if (authData?.user && !authData?.session) {
        setIsLoading(false);
        setMsg({
          text: "Account created! Please check your email to confirm your account before logging in.",
          type: "info",
        });
        return;
      }
    } catch {
      // Continue with local storage registration fallback
    }

    const newProfile: Profile = {
      id: userId,
      name: trimmedName,
      email: trimmedEmail,
      role: (COMPANY.adminEmails as readonly string[]).includes(trimmedEmail.toLowerCase()) ? "admin" : "client",
      ref_code: generatedCode,
      referred_by: refCode || null,
      bonus_earned: 0,
    };

    if (refCode) {
      localStore.recordReferral(refCode, userId);
    }
    await db.saveProfile(newProfile);
    localStore.setUser(newProfile);
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

  // 4. Magic Link (Email me a secure login)
  async function handleMagicLinkSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMsg({ text: "Please enter your email address in the field above to receive a secure link.", type: "error" });
      return;
    }
    setIsLoading(true);
    setMsg(null);
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectUrl,
          data: refCode ? { referred_by: refCode } : undefined,
        },
      });
      if (error) {
        setMsg({ text: error.message || "Failed to send magic link.", type: "error" });
      } else {
        setLinkSent(true);
        setMsg({ text: "Secure login link sent to your email.", type: "success" });
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // 5. Reset Password
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
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : "/dashboard";
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: redirectUrl,
      });
      if (error) {
        setMsg({ text: error.message || "Failed to send password reset email.", type: "error" });
      } else {
        setResetSent(true);
        setMsg({ text: "Password reset instructions sent to your email.", type: "success" });
        setShowResetModal(false);
      }
    } catch (err: any) {
      setMsg({ text: err?.message || "An unexpected error occurred.", type: "error" });
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
        backgroundImage: "radial-gradient(ellipse at 50% 20%, rgba(13, 37, 69, 0.7) 0%, #0a192f 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Centered White Card */}
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
        {/* Top of the card: Company logo and name */}
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
              boxShadow: "0 4px 12px rgba(10, 25, 47, 0.25)",
              marginBottom: "12px",
              border: "1px solid rgba(245, 197, 24, 0.3)",
            }}
          >
            Æ
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0a192f",
              margin: "0 0 4px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Aetheris Capital
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              margin: 0,
              fontWeight: 500,
            }}
          >
            {view === "login" ? "Log in to your account" : "Create your institutional account"}
          </p>
        </div>

        {/* Message notification */}
        {msg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: 1.4,
              marginBottom: "16px",
              backgroundColor: msg.type === "error" ? "#fef2f2" : msg.type === "success" ? "#f0fdf4" : "#eff6ff",
              color: msg.type === "error" ? "#991b1b" : msg.type === "success" ? "#166534" : "#1e40af",
              border: `1px solid ${msg.type === "error" ? "#fecaca" : msg.type === "success" ? "#bbf7d0" : "#bfdbfe"}`,
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Magic Link Sent State */}
        {linkSent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✉️</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0a192f", marginBottom: 8 }}>
              Check your email
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, marginBottom: 20 }}>
              We've sent a secure login link to <strong>{email}</strong>. Click the link in your email to instantly access your portfolio.
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
                padding: "6px 12px",
                textDecoration: "underline",
              }}
            >
              Use a different email address or method
            </button>
          </div>
        ) : (
          <>
            {/* FIRST SECTION: Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "10px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1f2937",
                cursor: "pointer",
                transition: "background-color 0.15s, border-color 0.15s",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* DIVIDER: OR Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "18px 0",
                textAlign: "center",
              }}
            >
              <div style={{ flex: 1, borderBottom: "1px solid #e2e8f0" }}></div>
              <span
                style={{
                  padding: "0 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, borderBottom: "1px solid #e2e8f0" }}></div>
            </div>

            {/* SECOND SECTION: Email and password input fields */}
            <form onSubmit={view === "login" ? handleEmailPasswordLogin : handleEmailPasswordSignup}>
              {view === "signup" && (
                <div style={{ marginBottom: "14px" }}>
                  <label
                    htmlFor="ap-name"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    id="ap-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Fiona O'Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="ap-email"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Email address
                </label>
                <input
                  id="ap-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="investor@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="ap-password"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Password
                </label>
                <input
                  id="ap-password"
                  name="password"
                  type="password"
                  required
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                  placeholder={view === "signup" ? "At least 8 characters" : "••••••••"}
                  minLength={view === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              {view === "signup" && (
                <>
                  <div style={{ marginBottom: "14px" }}>
                    <label
                      htmlFor="ap-confirm"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "5px",
                      }}
                    >
                      Confirm Password
                    </label>
                    <input
                      id="ap-confirm"
                      name="confirm"
                      type="password"
                      required
                      placeholder="Repeat password"
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>

                  {refCode && (
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#475569",
                        marginBottom: "14px",
                      }}
                    >
                      Referral Code attached: <strong style={{ color: "#0a192f" }}>{refCode}</strong>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <input
                      id="ap-terms"
                      type="checkbox"
                      required
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={isLoading}
                      style={{ marginTop: "3px", cursor: "pointer" }}
                    />
                    <label
                      htmlFor="ap-terms"
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        cursor: "pointer",
                        lineHeight: 1.4,
                      }}
                    >
                      I agree to the Terms of Service and Privacy Policy.
                    </label>
                  </div>
                </>
              )}

              {/* Purple/blue Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  backgroundColor: "#4f46e5",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
              >
                {isLoading
                  ? "Processing..."
                  : view === "login"
                  ? "Login with email"
                  : "Sign up with email"}
              </button>
            </form>

            {/* THIRD SECTION (Login only): Email me a secure login */}
            {view === "login" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px 16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: "2px" }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: "#1e293b",
                        fontWeight: 600,
                        marginBottom: "3px",
                      }}
                    >
                      Email me a secure login
                    </strong>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        lineHeight: 1.45,
                        margin: 0,
                      }}
                    >
                      Don't worry if you don't have a password or you can't remember it, we can email you a secure link.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMagicLinkSignIn}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "9px 14px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    color: "#1f2937",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                >
                  Email me a secure login
                </button>
              </div>
            )}

            {/* BOTTOM: Reset password link and View Switch */}
            <div
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              {view === "login" && (
                <div style={{ marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Reset password
                  </button>
                </div>
              )}

              <div>
                {view === "login" ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Log in
                    </button>
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 25, 47, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "28px 24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
              color: "#1e293b",
            }}
          >
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0", color: "#0a192f" }}>
              Reset your password
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.4 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handlePasswordReset}>
              <input
                type="email"
                required
                placeholder="investor@institution.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "7px",
                  marginBottom: "14px",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{
                    flex: 1,
                    padding: "9px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "9px",
                    backgroundColor: "#4f46e5",
                    border: "none",
                    borderRadius: "7px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  {isLoading ? "Sending..." : "Send link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AuthPage;
