import React, { useState, useMemo, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ADDRESS_LINES, COMPANY, PLANS, formatCurrency, type Profile } from "../lib/aetheris";
import { MARKET_FALLBACK, type MarketRow } from "../lib/market";
import { LeadForm } from "./LeadForm";

type DrawerSubView =
  | null
  | "plans"
  | "yield-engine"
  | "markets"
  | "calculator"
  | "about"
  | "legal"
  | "terms"
  | "consultation";

export function Navbar({
  profile,
  onOpenAuth,
  onToggleDashboard,
  showingDashboard,
  onOpenLegal,
  onOpenCiCd,
}: {
  profile: Profile | null;
  onOpenAuth: (view: "signup" | "login") => void;
  onToggleDashboard: () => void;
  showingDashboard: boolean;
  onOpenLegal?: ((type: "terms" | "privacy") => void) | undefined;
  onOpenCiCd?: (() => void) | undefined;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSubView, setDrawerSubView] = useState<DrawerSubView>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  // Embedded mobile drawer calculator state
  const [drawerCalcAmount, setDrawerCalcAmount] = useState<number>(500);
  const [drawerCalcPlanId, setDrawerCalcPlanId] = useState<string>("growth");

  const selectedDrawerCalcPlan = useMemo(() => {
    return PLANS.find((p) => p.id === drawerCalcPlanId) ?? PLANS[1]!;
  }, [drawerCalcPlanId]);

  const drawerCalcYield = Math.round((drawerCalcAmount * selectedDrawerCalcPlan.returnPct) / 100);
  const drawerCalcTotal = drawerCalcAmount + drawerCalcYield;

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerSubView(null);
  }

  function handleOpenAbout(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    closeDrawer();
    setIsAboutOpen(true);
  }

  function handleOpenLegal(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    closeDrawer();
    if (onOpenLegal) {
      onOpenLegal("terms");
    } else {
      setIsLegalOpen(true);
    }
  }

  function openSupport() {
    closeDrawer();
    window.dispatchEvent(new CustomEvent("aetheris:open-support"));
  }

  return (
    <>
      <header className="navbar">
        <a
          href="#top"
          className="brand"
          onClick={(e) => {
            if (showingDashboard) {
              e.preventDefault();
              onToggleDashboard();
            }
          }}
        >
          <span className="brand-mark">Æ</span>
          <div className="brand-text">
            <span className="brand-name">{COMPANY.name}</span>
            <span className="brand-sub">Global Institutional Desk</span>
          </div>
        </a>

        <nav className="nav-links">
          {!showingDashboard && (
            <>
              <a href="#markets" className="nav-text-btn">
                Markets
              </a>
              <a href="#plans" className="nav-text-btn">
                Yield Strategies
              </a>
              <a href="#calculator" className="nav-text-btn">
                Calculator
              </a>
              <button
                type="button"
                className="nav-text-btn"
                onClick={handleOpenAbout}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                About Us
              </button>
              <button
                type="button"
                className="nav-text-btn"
                onClick={handleOpenLegal}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Legal & Compliance
              </button>
              <a href="#consultation" className="nav-text-btn">
                Consultation
              </a>
            </>
          )}

          {onOpenCiCd && (
            <button
              type="button"
              className="cicd-nav-btn"
              onClick={onOpenCiCd}
              style={{
                background: "rgba(0, 229, 245, 0.1)",
                border: "1px solid rgba(0, 229, 245, 0.3)",
                color: "var(--cyan)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
              title="View GitHub CI/CD Deployment Pipeline"
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ade80",
                  display: "inline-block",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
              <span>CI/CD Pipeline</span>
            </button>
          )}

          {profile ? (
            <button className="primary-btn" type="button" onClick={onToggleDashboard}>
              {showingDashboard ? "View Public Hub" : "Client Portfolio"}
            </button>
          ) : (
            <>
              <button className="ghost-btn" type="button" onClick={() => onOpenAuth("login")}>
                Client Login
              </button>
              <button className="primary-btn" type="button" onClick={() => onOpenAuth("signup")}>
                Open Account
              </button>
            </>
          )}
        </nav>

        <button
          className="hamburger-btn"
          type="button"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation-drawer"
          onClick={() => {
            setDrawerSubView(null);
            setDrawerOpen(true);
          }}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>

        {drawerOpen &&
          createPortal(
            <div className="drawer-overlay" onClick={closeDrawer}>
              <aside
                id="mobile-navigation-drawer"
                className="drawer"
                aria-label="Mobile navigation"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="drawer-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="brand-mark">Æ</span>
                    {drawerSubView && (
                      <button
                        type="button"
                        className="drawer-back-btn"
                        onClick={() => setDrawerSubView(null)}
                      >
                        ← Back to Menu
                      </button>
                    )}
                  </div>
                  <button
                    className="drawer-close"
                    type="button"
                    aria-label="Close menu"
                    onClick={closeDrawer}
                  >
                    ✕
                  </button>
                </div>

                {drawerSubView === null && (
                  <nav className="drawer-nav">
                    <div className="drawer-group-title">Product & Yield</div>
                    <button
                      type="button"
                      className="drawer-link"
                      onClick={() => setDrawerSubView("plans")}
                      style={{ width: "100%" }}
                    >
                      <span>Fixed-Yield Mandates</span>
                      <span className="drawer-badge">Up to 25%</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      onClick={() => setDrawerSubView("yield-engine")}
                      style={{ width: "100%" }}
                    >
                      <span>Yield Engine & Strategy</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      onClick={() => setDrawerSubView("markets")}
                      style={{ width: "100%" }}
                    >
                      <span>Benchmark Feeds</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      onClick={() => setDrawerSubView("calculator")}
                      style={{ width: "100%" }}
                    >
                      <span>Yield Calculator</span>
                    </button>
                    <div className="drawer-group-title" style={{ marginTop: 14 }}>
                      Company & Governance
                    </div>
                    <button
                      type="button"
                      className="drawer-link"
                      style={{ width: "100%" }}
                      onClick={() => setDrawerSubView("about")}
                    >
                      <span>Corporate Overview</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      style={{ width: "100%" }}
                      onClick={() => setDrawerSubView("legal")}
                    >
                      <span>Legal & Compliance</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      style={{ width: "100%" }}
                      onClick={() => setDrawerSubView("terms")}
                    >
                      <span>Terms & Conditions</span>
                    </button>
                    <button
                      type="button"
                      className="drawer-link"
                      style={{ width: "100%" }}
                      onClick={() => setDrawerSubView("consultation")}
                    >
                      <span>Institutional Consultation</span>
                    </button>
                    <div className="drawer-group-title" style={{ marginTop: 14 }}>
                      Support & DevOps
                    </div>
                    <button
                      className="drawer-link"
                      type="button"
                      onClick={openSupport}
                      style={{ width: "100%" }}
                    >
                      <span>24/7 Global Support Desk</span>
                    </button>
                    {onOpenCiCd && (
                      <button
                        className="drawer-link"
                        type="button"
                        style={{ color: "var(--accent)", width: "100%" }}
                        onClick={() => {
                          closeDrawer();
                          onOpenCiCd();
                        }}
                      >
                        <span>CI/CD Deployment Hub</span>
                        <span className="drawer-badge-green">Active</span>
                      </button>
                    )}
                  </nav>
                )}

                {drawerSubView === "plans" && (
                  <div className="drawer-subview-content">
                    <div>
                      <h3 className="drawer-subview-title">Fixed-Yield Mandates</h3>
                      <p className="drawer-subview-sub">
                        Select a capital deployment tier tailored to your portfolio.
                      </p>
                    </div>
                    {PLANS.map((plan) => (
                      <div className="drawer-sub-card" key={plan.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <strong style={{ color: "var(--white)", fontSize: "0.95rem" }}>
                            {plan.name}
                          </strong>
                          <span className="drawer-badge">{plan.badge}</span>
                        </div>
                        <div
                          style={{
                            fontSize: "1.1rem",
                            color: "var(--gold-light)",
                            fontWeight: 700,
                            fontFamily: "Playfair Display, Georgia, serif",
                          }}
                        >
                          {formatCurrency(plan.amount)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            margin: "6px 0 10px",
                            fontSize: "0.8rem",
                            color: "var(--green)",
                          }}
                        >
                          <span>+{plan.returnPct}% Net Yield</span>
                          <span style={{ color: "var(--muted)" }}>·</span>
                          <span style={{ color: "var(--muted-light)" }}>{plan.termDays} Days</span>
                        </div>
                        <ul
                          style={{
                            margin: "0 0 12px",
                            paddingLeft: 18,
                            fontSize: "0.76rem",
                            color: "var(--muted-light)",
                            lineHeight: 1.5,
                          }}
                        >
                          {plan.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                        <button
                          className="primary-btn"
                          type="button"
                          style={{
                            width: "100%",
                            padding: "7px 12px",
                            minHeight: 38,
                            fontSize: "0.8rem",
                          }}
                          onClick={() => {
                            closeDrawer();
                            if (!profile) onOpenAuth("signup");
                            else onToggleDashboard();
                          }}
                        >
                          {plan.actionText}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {drawerSubView === "calculator" && (
                  <div className="drawer-subview-content">
                    <div>
                      <h3 className="drawer-subview-title">Yield Calculator</h3>
                      <p className="drawer-subview-sub">Estimate fixed-term returns by mandate.</p>
                    </div>
                    <div className="drawer-sub-card">
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          marginBottom: 6,
                        }}
                      >
                        Allocation (USD)
                      </label>
                      <input
                        type="number"
                        min={100}
                        value={drawerCalcAmount}
                        onChange={(e) =>
                          setDrawerCalcAmount(Math.max(0, Number(e.target.value) || 0))
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #374151",
                          background: "#111827",
                          color: "#F8FAFC",
                        }}
                      />
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "var(--muted)",
                          margin: "12px 0 6px",
                        }}
                      >
                        Mandate
                      </label>
                      <select
                        value={drawerCalcPlanId}
                        onChange={(e) => setDrawerCalcPlanId(e.target.value)}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #374151",
                          background: "#111827",
                          color: "#F8FAFC",
                        }}
                      >
                        {PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div
                        style={{ marginTop: 14, fontSize: "0.85rem", color: "var(--muted-light)" }}
                      >
                        <div>
                          Projected yield:{" "}
                          <strong style={{ color: "var(--gold-light)" }}>
                            {formatCurrency(drawerCalcYield)}
                          </strong>
                        </div>
                        <div>
                          Terminal value:{" "}
                          <strong style={{ color: "var(--white)" }}>
                            {formatCurrency(drawerCalcTotal)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(drawerSubView === "about" ||
                  drawerSubView === "legal" ||
                  drawerSubView === "terms" ||
                  drawerSubView === "consultation" ||
                  drawerSubView === "yield-engine" ||
                  drawerSubView === "markets") && (
                  <div className="drawer-subview-content">
                    <div>
                      <h3 className="drawer-subview-title">{drawerSubView.replace("-", " ")}</h3>
                      <p className="drawer-subview-sub">
                        Open the corresponding section on the public site for full details.
                      </p>
                    </div>
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        window.location.hash = drawerSubView === "about" ? "about" : drawerSubView;
                      }}
                    >
                      View section
                    </button>
                  </div>
                )}

                <div className="drawer-foot">
                  {profile ? (
                    <button
                      className="primary-btn"
                      type="button"
                      style={{ width: "100%" }}
                      onClick={() => {
                        closeDrawer();
                        onToggleDashboard();
                      }}
                    >
                      {showingDashboard ? "View Public Hub" : "Client Portfolio"}
                    </button>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={() => {
                          closeDrawer();
                          onOpenAuth("signup");
                        }}
                      >
                        Open Account
                      </button>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => {
                          closeDrawer();
                          onOpenAuth("login");
                        }}
                      >
                        Client Login
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            </div>,
            document.body,
          )}
      </header>

      {isAboutOpen && (
        <div className="modal open" onClick={() => setIsAboutOpen(false)}>
          <div className="plan-box" onClick={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setIsAboutOpen(false)}>
              ×
            </button>
            <h2>About {COMPANY.name}</h2>
            <p className="auth-sub">{COMPANY.tagline}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              {ADDRESS_LINES.join(", ")}. Support: {COMPANY.email}. Hours: {COMPANY.hours}.
            </p>
          </div>
        </div>
      )}

      {isLegalOpen && (
        <div className="modal open" onClick={() => setIsLegalOpen(false)}>
          <div className="plan-box" onClick={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setIsLegalOpen(false)}>
              ×
            </button>
            <h2>Legal & Compliance</h2>
            <p className="auth-sub">
              Terms, privacy and institutional disclosures are available from the public site
              footer.
            </p>
            <button className="primary-btn" type="button" onClick={() => setIsLegalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
