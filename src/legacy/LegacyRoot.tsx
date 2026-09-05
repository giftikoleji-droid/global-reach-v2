import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { AuthModal } from "@/components/AuthModal";
import { AuthPage } from "@/components/AuthPage";
import { CiCdPipelineModal } from "@/components/CiCdPipelineModal";
import { Dashboard } from "@/dashboard/Dashboard";
import { Footer } from "@/components/Footer";
import { GlobeCanvas } from "@/components/GlobeCanvas";
import { LegalDrawers } from "@/components/LegalDrawers";
import { MarketGrid } from "@/components/MarketGrid";
import { Navbar } from "@/components/Navbar";
import { NewsTicker } from "@/components/NewsTicker";
import { PlanModal } from "@/components/PlanModal";
import { SupportChat } from "@/components/SupportChat";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { COMPANY, PLANS, type Profile } from "@/lib/aetheris";
import { fetchMarkets, type MarketRow } from "@/lib/market";

function MainContent() {
  const { session, profile: authProfile, logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const routerPath = useLocation({ select: (l) => l.pathname });
  const [path, setPath] = useState(routerPath);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"signup" | "login">("signup");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [cicdOpen, setCicdOpen] = useState(false);
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    setProfile(authProfile);
  }, [authProfile]);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const data = await fetchMarkets();
      if (alive) setMarkets(data);
    };
    void load();
    const timer = window.setInterval(load, 45000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const isAuth = ["/auth", "/login", "/signup"].includes(path);
  const isPrivate = [
    "/dashboard",
    "/portfolio",
    "/investments",
    "/wallets",
    "/referrals",
    "/profile",
  ].includes(path);
  const isAdmin = Boolean(
    authProfile?.role === "admin" ||
    (COMPANY.adminEmails as readonly string[]).includes((session?.user?.email || "").toLowerCase()),
  );
  const openAuth = (view: "signup" | "login") => {
    setAuthView(view);
    setAuthOpen(true);
  };

  // A valid authenticated session must never remain on the public landing page.
  // This also covers OAuth/magic-link returns that arrive at `/` instead of
  // `/dashboard` after Supabase restores the session.
  useEffect(() => {
    if (!authLoading && session?.user && profile && !isAuth && !isPrivate && path === "/") {
      navigate("/dashboard");
    }
  }, [authLoading, session, profile, isAuth, isPrivate, path]);

  const handlePlanSelection = (planId: string) => {
    if (session?.user) {
      setSelectedPlanId(planId);
      return;
    }
    openAuth("signup");
  };

  async function logoutAndHome() {
    await logout();
    setProfile(null);
    navigate("/");
  }

  return (
    <div className="page-wrap" id="top">
      <GlobeCanvas />
      {!isPrivate && !isAuth && (
        <Navbar
          profile={profile}
          onOpenAuth={openAuth}
          onOpenLegal={setLegal}
          onOpenCiCd={isAdmin ? () => setCicdOpen(true) : undefined}
          onToggleDashboard={() => navigate(profile ? "/dashboard" : "/login")}
          showingDashboard={false}
        />
      )}

      {isAuth ? (
        <AuthPage
          initialView={path === "/signup" ? "signup" : "login"}
          onSuccess={() => navigate("/dashboard")}
        />
      ) : isPrivate ? (
        authLoading ? (
          <div
            style={{
              minHeight: "70vh",
              display: "grid",
              placeItems: "center",
              color: "var(--muted-light)",
            }}
          >
            Loading secure client session…
          </div>
        ) : session && profile ? (
          <Dashboard
            profile={profile}
            onLogout={logoutAndHome}
            onBrowsePlans={() => navigate("/investments")}
            onChoosePlan={(planId) => setSelectedPlanId(planId)}
          />
        ) : (
          <AuthPage initialView="login" onSuccess={() => navigate("/dashboard")} />
        )
      ) : (
        <main className="landing">
          <section
            className="hero hero-modern"
            style={{ padding: "clamp(88px, 12vw, 132px) 20px 0" }}
          >
            <div
              className="hero-content"
              style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}
            >
              <h1
                style={{
                  fontSize: "clamp(2.7rem, 7vw, 5.4rem)",
                  lineHeight: 1.02,
                  margin: 0,
                  letterSpacing: "-0.045em",
                  fontWeight: 800,
                }}
              >
                STRUCTURED DIGITAL-ASSET MANAGEMENT
              </h1>
              <p
                className="hero-lead"
                style={{
                  maxWidth: 780,
                  margin: "28px auto 0",
                  fontSize: "clamp(1rem, 2vw, 1.2rem)",
                  lineHeight: 1.75,
                }}
              >
                Built for the Long Term — Institutional-grade custody, transparent portfolios, and
                defined-term mandates.
              </p>
              <div
                className="hero-trust-badges"
                aria-label="Aetheris Capital trust signals"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 28,
                }}
              >
                <span
                  className="hero-trust-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(212,175,55,.32)",
                    background: "rgba(212,175,55,.08)",
                    color: "#E6C45A",
                    fontSize: ".72rem",
                    fontWeight: 750,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open to Everyone
                </span>
                <span
                  className="hero-trust-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(212,175,55,.32)",
                    background: "rgba(212,175,55,.08)",
                    color: "#E6C45A",
                    fontSize: ".72rem",
                    fontWeight: 750,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Institutional-grade Custody
                </span>
              </div>
              <div
                className="hero-actions"
                style={{ justifyContent: "center", gap: 16, marginTop: 32 }}
              >
                <button
                  className="primary-btn"
                  type="button"
                  style={{ minWidth: 220 }}
                  onClick={() => (profile ? navigate("/dashboard") : openAuth("signup"))}
                >
                  {profile ? "Open My Portfolio" : "Create Your Free Account"}
                </button>
                <a
                  href="#plans"
                  className="ghost-btn"
                  style={{
                    minWidth: 220,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  Explore Investment Plans
                </a>
              </div>
            </div>
            <div
              className="hero-ticker"
              aria-label="Market information"
              style={{
                width: "100%",
                maxWidth: 1180,
                margin: "clamp(64px, 9vw, 96px) auto 0",
                borderTop: "1px solid rgba(212,175,55,.16)",
                padding: "14px 0 0",
                opacity: 0.82,
              }}
            >
              <NewsTicker />
              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  paddingBottom: 16,
                  color: "#94A3B8",
                  fontSize: ".65rem",
                  fontWeight: 650,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                }}
              >
                Global Institutional Networks
              </div>
            </div>
          </section>

          <section className="section" aria-label="Why Aetheris Capital">
            <div className="container">
              <div className="section-label">Why Aetheris</div>
              <h2 className="section-title">A More Structured Way to Access Digital-Asset Yield</h2>
              <p className="section-text" style={{ maxWidth: 760, marginBottom: 28 }}>
                Aetheris is designed around clarity, disciplined allocation and a client experience
                that keeps your investment information organized.
              </p>
              <div className="strategy-cards-grid value-grid">
                <article className="strategy-card glass-card value-card">
                  <div className="strategy-tag">01 · Security</div>
                  <h3 className="strategy-title">Secure Account Infrastructure</h3>
                  <p className="strategy-plain">
                    Authenticated client access keeps portfolio information separated and available
                    through a private account experience.
                  </p>
                </article>
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">02 · Transparency</div>
                  <h3 className="strategy-title">Clear Portfolio Structure</h3>
                  <p className="strategy-plain">
                    Investment plans present defined terms, strategy positioning and return
                    information before you commit capital.
                  </p>
                </article>
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">03 · Reporting</div>
                  <h3 className="strategy-title">Professional Client Reporting</h3>
                  <p className="strategy-plain">
                    Your client portal is built to make balances, investments and account activity
                    easier to understand.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="markets-section" id="markets">
            <div className="container">
              <div className="section-label">Live Market Data</div>
              <h2 className="section-title">Stay Ahead of the Market</h2>
              <p className="section-text" style={{ marginBottom: 20 }}>
                Monitor live digital-asset benchmarks alongside current market coverage as you
                evaluate the broader environment.
              </p>
              <MarketGrid
                markets={markets}
                expanded={expanded}
                onToggle={() => setExpanded(!expanded)}
              />
            </div>
          </section>

          <section className="section" id="yield-engine">
            <div className="container">
              <div className="section-label">How We Generate Returns</div>
              <h2 className="section-title">Our Yield Engine &amp; Core Strategies</h2>
              <p className="section-text" style={{ marginBottom: 28 }}>
                Capital is allocated across distinct strategy sleeves with defined risk profiles and
                institutional controls.
              </p>
              <div className="strategy-cards-grid">
                <div className="strategy-card glass-card">
                  <div className="strategy-head">
                    <span className="strategy-tag">Preservation Sleeve</span>
                    <span className="badge-risk low">Low Risk</span>
                  </div>
                  <h3 className="strategy-title">Market-Neutral Funding Income</h3>
                  <div className="strategy-apy">
                    <span className="apy-num">8%–15%</span>
                    <span className="apy-label">Target APY</span>
                  </div>
                  <p className="strategy-plain">
                    Market-neutral funding strategies designed to reduce directional exposure.
                  </p>
                </div>
                <div className="strategy-card glass-card">
                  <div className="strategy-head">
                    <span className="strategy-tag">Optimization Sleeve</span>
                    <span className="badge-risk collat">Over-Collateralized</span>
                  </div>
                  <h3 className="strategy-title">Secured Lending &amp; Staking</h3>
                  <div className="strategy-apy">
                    <span className="apy-num">5%–9%</span>
                    <span className="apy-label">Target APY</span>
                  </div>
                  <p className="strategy-plain">
                    Secured lending and staking strategies with defined collateral controls.
                  </p>
                </div>
                <div className="strategy-card glass-card">
                  <div className="strategy-head">
                    <span className="strategy-tag">Alpha Sleeve</span>
                    <span className="badge-risk managed">Managed Risk</span>
                  </div>
                  <h3 className="strategy-title">Active Liquidity Provision</h3>
                  <div className="strategy-apy">
                    <span className="apy-num">10%–18%</span>
                    <span className="apy-label">Target APY</span>
                  </div>
                  <p className="strategy-plain">
                    Active liquidity strategies with automated rebalancing and risk controls.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="plans">
            <div className="container">
              <div className="section-label">Investment Plans</div>
              <h2 className="section-title">Choose the Plan That Fits Your Capital</h2>
              <p className="section-text" style={{ maxWidth: 760, marginBottom: 28 }}>
                Four structured investment tiers, from an accessible starting point to a premier
                allocation for larger capital.
              </p>
              <div className="plans-grid">
                {PLANS.map((plan) => (
                  <article className="plan-card glass-card" key={plan.id}>
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-range">
                      {formatCurrency(plan.minAmount)}
                      {plan.maxAmount ? ` – ${formatCurrency(plan.maxAmount)}` : "+"}
                    </div>
                    <div className="plan-return">{plan.returnPct}%</div>
                    <div className="plan-term">{plan.termDays} day term</div>
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => handlePlanSelection(plan.id)}
                    >
                      {plan.actionText}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="how-it-works">
            <div className="container">
              <div className="section-label">How It Works</div>
              <h2 className="section-title">A Simple Four-Step Client Journey</h2>
              <div className="strategy-cards-grid">
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">01</div>
                  <h3 className="strategy-title">Create Your Account</h3>
                  <p className="strategy-plain">
                    Open your secure Aetheris client account and access your private portfolio
                    environment.
                  </p>
                </article>
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">02</div>
                  <h3 className="strategy-title">Select a Plan</h3>
                  <p className="strategy-plain">
                    Review the available investment tiers, terms and strategy information before
                    selecting your plan.
                  </p>
                </article>
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">03</div>
                  <h3 className="strategy-title">Fund Your Investment</h3>
                  <p className="strategy-plain">
                    Follow the account instructions to complete the investment process for your
                    selected mandate.
                  </p>
                </article>
                <article className="strategy-card glass-card">
                  <div className="strategy-tag">04</div>
                  <h3 className="strategy-title">Monitor Your Portfolio</h3>
                  <p className="strategy-plain">
                    Track your investment, balances and account activity through the authenticated
                    client dashboard.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="section" id="referral-cta">
            <div className="container">
              <div
                className="glass-card"
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  borderColor: "rgba(212,175,55,.3)",
                }}
              >
                <div className="section-label">Refer &amp; Earn</div>
                <h2 className="section-title" style={{ marginBottom: 10 }}>
                  Know Someone Who Should Be Here?
                </h2>
                <p className="section-text" style={{ maxWidth: 650, margin: "0 auto 20px" }}>
                  Share Aetheris Capital with your network and participate in our referral program
                  from your client dashboard.
                </p>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => (profile ? navigate("/referrals") : openAuth("signup"))}
                >
                  {profile ? "Open Refer & Earn" : "Create Your Account"}
                </button>
              </div>
            </div>
          </section>

          <section className="section" id="about">
            <div className="container">
              <div className="section-label">Aetheris Capital</div>
              <h2 className="section-title">Institutional Digital-Asset Yield · Global Desk</h2>
              <p className="section-text">
                Aetheris Capital provides structured digital-asset mandates through a private client
                portal, with transparent plan terms, authenticated account access and portfolio
                reporting.
              </p>
            </div>
          </section>
          <Footer />
          <SupportChat />
        </main>
      )}

      {authOpen && (
        <AuthModal
          open={authOpen}
          view={authView}
          onView={setAuthView}
          onClose={() => setAuthOpen(false)}
          onSuccess={(p) => {
            setProfile(p);
            setAuthOpen(false);
            navigate("/dashboard");
          }}
        />
      )}
      {selectedPlanId && (
        <PlanModal
          planId={selectedPlanId}
          user={profile}
          onClose={() => setSelectedPlanId(null)}
          onCreated={() => setSelectedPlanId(null)}
          onRequireAuth={() => {
            setSelectedPlanId(null);
            openAuth("signup");
          }}
        />
      )}
      <LegalDrawers drawerType={legal} onClose={() => setLegal(null)} />
      {cicdOpen && <CiCdPipelineModal open={cicdOpen} onClose={() => setCicdOpen(false)} />}
    </div>
  );
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
