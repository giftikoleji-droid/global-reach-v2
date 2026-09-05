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
  onOpenLegal?: (type: "terms" | "privacy") => void;
  onOpenCiCd?: () => void;
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

        {/* Desktop Navigation */}
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
                Legal &amp; Compliance
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
                cursor: "pointer"
              }}
              title="View GitHub CI/CD Deployment Pipeline"
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
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

        {/* Hamburger Button */}
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

        {/* Drawer Overlay (portaled to body so the navbar's backdrop-filter doesn't trap the fixed positioning) */}
        {drawerOpen && createPortal(
          <div className="drawer-overlay" onClick={closeDrawer}>
            <aside id="mobile-navigation-drawer" className="drawer" aria-label="Mobile navigation" onClick={(e) => e.stopPropagation()}>
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
                <button className="drawer-close" type="button" aria-label="Close menu" onClick={closeDrawer}>
                  ✕
                </button>
              </div>

              {/* Main Menu View */}
              {drawerSubView === null && (
                <nav className="drawer-nav">
                  <div className="drawer-group-title">Product &amp; Yield</div>
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
                    <span>Yield Engine &amp; Strategy</span>
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

                  <div className="drawer-group-title" style={{ marginTop: 14 }}>Company &amp; Governance</div>
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
                    <span>Legal &amp; Compliance</span>
                  </button>
                  <button
                    type="button"
                    className="drawer-link"
                    style={{ width: "100%" }}
                    onClick={() => setDrawerSubView("terms")}
                  >
                    <span>Terms &amp; Conditions</span>
                  </button>
                  <button
                    type="button"
                    className="drawer-link"
                    style={{ width: "100%" }}
                    onClick={() => setDrawerSubView("consultation")}
                  >
                    <span>Institutional Consultation</span>
                  </button>

                  <div className="drawer-group-title" style={{ marginTop: 14 }}>Support &amp; DevOps</div>
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

              {/* Sub-View: Fixed-Yield Mandates */}
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <strong style={{ color: "var(--white)", fontSize: "0.95rem" }}>{plan.name}</strong>
                        <span className="drawer-badge">{plan.badge}</span>
                      </div>
                      <div style={{ fontSize: "1.1rem", color: "var(--gold-light)", fontWeight: 700, fontFamily: "Playfair Display, Georgia, serif" }}>
                        {formatCurrency(plan.amount)}
                      </div>
                      <div style={{ display: "flex", gap: 10, margin: "6px 0 10px", fontSize: "0.8rem", color: "var(--green)" }}>
                        <span>+{plan.returnPct}% Net Yield</span>
                        <span style={{ color: "var(--muted)" }}>·</span>
                        <span style={{ color: "var(--muted-light)" }}>{plan.termDays} Days</span>
                      </div>
                      <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5 }}>
                        {plan.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                      <button
                        className="primary-btn"
                        type="button"
                        style={{ width: "100%", padding: "7px 12px", minHeight: 38, fontSize: "0.8rem" }}
                        onClick={() => {
                          closeDrawer();
                          if (!profile) {
                            onOpenAuth("signup");
                          } else {
                            onToggleDashboard();
                          }
                        }}
                      >
                        {plan.actionText}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-View: Yield Engine & Strategy */}
              {drawerSubView === "yield-engine" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Yield Engine &amp; Strategy</h3>
                    <p className="drawer-subview-sub">
                      Three risk-mitigated digital-asset sleeves generating uncorrelated institutional returns.
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--gold-light)", textTransform: "uppercase", fontWeight: 700 }}>Preservation Sleeve</span>
                      <span className="badge-risk low" style={{ fontSize: "0.68rem", padding: "2px 6px" }}>Low Risk</span>
                    </div>
                    <h4 style={{ color: "var(--white)", fontSize: "0.88rem", margin: "4px 0" }}>Delta-Neutral Funding Arb</h4>
                    <div style={{ color: "var(--gold-light)", fontSize: "0.82rem", fontWeight: 700, margin: "2px 0 6px" }}>8%–15% Target APY</div>
                    <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                      Captures perpetual futures funding rate disparities across tier-1 exchanges with net-zero directional market risk.
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--gold-light)", textTransform: "uppercase", fontWeight: 700 }}>Optimization Sleeve</span>
                      <span className="badge-risk collat" style={{ fontSize: "0.68rem", padding: "2px 6px" }}>Over-Collat</span>
                    </div>
                    <h4 style={{ color: "var(--white)", fontSize: "0.88rem", margin: "4px 0" }}>Institutional Lending &amp; Staking</h4>
                    <div style={{ color: "var(--gold-light)", fontSize: "0.82rem", fontWeight: 700, margin: "2px 0 6px" }}>5%–9% Target APY</div>
                    <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                      Allocates liquidity to prime institutional counterparties backed by minimum 140% crypto collateralization.
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--gold-light)", textTransform: "uppercase", fontWeight: 700 }}>Alpha Sleeve</span>
                      <span className="badge-risk managed" style={{ fontSize: "0.68rem", padding: "2px 6px" }}>Managed</span>
                    </div>
                    <h4 style={{ color: "var(--white)", fontSize: "0.88rem", margin: "4px 0" }}>Concentrated Liquidity Provision</h4>
                    <div style={{ color: "var(--gold-light)", fontSize: "0.82rem", fontWeight: 700, margin: "2px 0 6px" }}>10%–18% Target APY</div>
                    <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                      Dynamic automated range liquidity on top decentralized venue pairs with automated rebalancing dampeners.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-View: Benchmark Feeds */}
              {drawerSubView === "markets" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Benchmark Feeds</h3>
                    <p className="drawer-subview-sub">
                      Institutional digital-asset pricing and index feeds.
                    </p>
                  </div>

                  {MARKET_FALLBACK.map((m) => {
                    const up = m.change >= 0;
                    return (
                      <div className="drawer-sub-card" key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--white)", fontSize: "0.88rem" }}>{m.name}</div>
                          <div style={{ color: "var(--muted)", fontSize: "0.74rem" }}>{m.symbol}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "var(--white)", fontSize: "0.88rem", fontVariantNumeric: "tabular-nums" }}>
                            ${m.price.toLocaleString()}
                          </div>
                          <div style={{ color: up ? "var(--green)" : "var(--red)", fontSize: "0.74rem", fontWeight: 600 }}>
                            {up ? "+" : ""}{m.change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-View: Yield Calculator */}
              {drawerSubView === "calculator" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Institutional Calculator</h3>
                    <p className="drawer-subview-sub">
                      Simulate returns based on fixed-term capital allocations.
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--muted-light)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
                        Select Mandate
                      </label>
                      <select
                        style={{ width: "100%", padding: "8px 10px", background: "#050f1d", border: "1px solid #1c365d", borderRadius: 4, color: "var(--white)", fontSize: "0.82rem" }}
                        value={drawerCalcPlanId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setDrawerCalcPlanId(pId);
                          const p = PLANS.find((x) => x.id === pId);
                          if (p) setDrawerCalcAmount(p.amount);
                        }}
                      >
                        {PLANS.map((p) => (
                          <option value={p.id} key={p.id}>
                            {p.name} ({formatCurrency(p.amount)}+ · +{p.returnPct}% / {p.termDays}d)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: "0.74rem", color: "var(--muted-light)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
                        Principal Allocation ($ USD)
                      </label>
                      <input
                        type="number"
                        min={selectedDrawerCalcPlan.amount}
                        step={50}
                        value={drawerCalcAmount}
                        onChange={(e) => setDrawerCalcAmount(Math.max(0, Number(e.target.value)))}
                        style={{ width: "100%", padding: "8px 10px", background: "#050f1d", border: "1px solid #1c365d", borderRadius: 4, color: "var(--white)", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", background: "rgba(3, 10, 22, 0.7)", borderRadius: 4, border: "1px solid #1c365d" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                        <span style={{ color: "var(--muted-light)" }}>Principal:</span>
                        <strong style={{ color: "var(--white)" }}>{formatCurrency(drawerCalcAmount)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                        <span style={{ color: "var(--muted-light)" }}>Net Return (+{selectedDrawerCalcPlan.returnPct}%):</span>
                        <strong style={{ color: "var(--green)" }}>+{formatCurrency(drawerCalcYield)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                        <span style={{ color: "var(--muted-light)" }}>Maturity:</span>
                        <strong style={{ color: "var(--white)" }}>{selectedDrawerCalcPlan.termDays} Days</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", borderTop: "1px solid #1c365d", paddingTop: 6, marginTop: 2 }}>
                        <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>Total Payout:</span>
                        <strong style={{ color: "var(--cyan)" }}>{formatCurrency(drawerCalcTotal)}</strong>
                      </div>
                    </div>

                    <button
                      className="primary-btn"
                      type="button"
                      style={{ width: "100%", marginTop: 14, minHeight: 38, fontSize: "0.82rem" }}
                      onClick={() => {
                        closeDrawer();
                        if (!profile) {
                          onOpenAuth("signup");
                        } else {
                          onToggleDashboard();
                        }
                      }}
                    >
                      Activate {selectedDrawerCalcPlan.name} Mandate
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-View: Corporate Overview */}
              {drawerSubView === "about" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Corporate Overview</h3>
                    <p className="drawer-subview-sub">
                      Institutional Digital-Asset Yield &amp; Corporate Governance
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <p style={{ fontSize: "0.8rem", color: "var(--muted-light)", lineHeight: 1.6, margin: "0 0 12px" }}>
                      Aetheris Capital Ltd. is a Dublin IFSC-based digital-asset investment firm providing fixed-term, risk-managed yield strategies to retail and institutional clients worldwide. Our quantitative strategies leverage systematic funding-rate arbitrage, cross-exchange liquidity spreads, and high-grade multi-signature cold custody to deliver consistent, risk-managed capital growth.
                    </p>
                    <div style={{ background: "rgba(3, 10, 22, 0.7)", border: "1px solid #1c365d", borderRadius: 4, padding: "10px 12px", fontSize: "0.76rem", color: "var(--muted-light)" }}>
                      <strong style={{ display: "block", color: "var(--white)", marginBottom: 4 }}>Registered Corporate Office</strong>
                      {ADDRESS_LINES.map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View: Legal & Compliance */}
              {drawerSubView === "legal" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Legal &amp; Compliance</h3>
                    <p className="drawer-subview-sub">
                      Regulatory disclosures, risk framework &amp; governance standards
                    </p>
                  </div>

                  <div className="drawer-sub-card">
                    <div style={{ marginBottom: 14 }}>
                      <strong style={{ color: "var(--white)", fontSize: "0.84rem", display: "block", marginBottom: 4 }}>
                        Institutional Governance Standard
                      </strong>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted-light)", lineHeight: 1.6, margin: 0 }}>
                        Aetheris Capital operates strictly under institutional commercial standards, ensuring the highest level of fiduciary duty to our clients. Our custody framework employs strict segregation of client capital from corporate funds, utilizing multi-signature cold storage and audited algorithmic escrow protocols. This ensures that your capital is managed with the utmost transparency and integrity.
                      </p>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <strong style={{ color: "var(--white)", fontSize: "0.84rem", display: "block", marginBottom: 4 }}>
                        AML, KYC &amp; Counter-Terrorist Financing
                      </strong>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted-light)", lineHeight: 1.6, margin: 0 }}>
                        We adhere to international Anti-Money Laundering (AML) standards. While minor accounts enjoy low-friction access, mandates of $5,000 and above are subject to our stringent full KYC process. This includes comprehensive identity verification and source-of-funds documentation, ensuring a secure and trusted ecosystem for all high-value capital deployments.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--white)", fontSize: "0.84rem", display: "block", marginBottom: 4 }}>
                        Digital Asset Risk Disclosure
                      </strong>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted-light)", lineHeight: 1.6, margin: 0 }}>
                        Digital assets carry inherent market dynamics. Our target yield models leverage diverse strategies to mitigate risk and protect capital. While historical performance reflects our robust framework, it does not guarantee future returns. Aetheris Capital provides transparent reporting of underlying strategies, allowing our clients to make informed decisions with confidence.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View: Terms & Conditions */}
              {drawerSubView === "terms" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Terms &amp; Conditions</h3>
                    <p className="drawer-subview-sub">
                      Client agreement, platform rules &amp; service terms
                    </p>
                  </div>

                  <div className="drawer-sub-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        1. Acceptance of Terms
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        By accessing, browsing, or using the Aetheris Capital website, mobile applications, or related services (collectively, the &quot;Platform&quot;), you agree to be bound by these Terms &amp; Conditions (&quot;Terms&quot;). If you do not agree, you must immediately discontinue use of the Platform.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        2. Definitions
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        &quot;Company,&quot; &quot;We,&quot; &quot;Us,&quot; or &quot;Our&quot; refers to Aetheris Capital Ltd. (Dublin IFSC). &quot;User,&quot; &quot;You,&quot; or &quot;Your&quot; refers to any individual or entity accessing the Platform. &quot;Digital Assets&quot; refers to cryptocurrencies such as BTC, ETH, and USDT. &quot;Institutional Client&quot; refers to entities meeting specific regulatory and financial thresholds. &quot;Retail Client&quot; refers to any other eligible user.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        3. Eligibility
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        You must be at least 18 years old and have the legal capacity to enter into a binding contract. You must not reside in jurisdictions where our Services are prohibited. By using the Platform, you represent that you are compliant with all local laws.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        4. Account Verification &amp; KYC
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        To ensure a smooth, seamless, and secure onboarding experience, standard account verification (email and basic identification) is required for all users. For mandates of $5,000 (Five Thousand Dollars) and above, full Know-Your-Customer (KYC) verification is required to comply with international regulatory standards.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        5. Institutional &amp; Retail User Classification
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        We operate a dual-tier system. Retail Clients (starting at $100) have access to Standard Mandates, while Institutional Clients have access to bespoke allocation algorithms and segregated custody. Classification is designed to provide tailored risk management frameworks.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        6. Risk Disclosure &amp; Transparency
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        Important Information Regarding Risks: Digital assets are subject to market fluctuations and inherent technological infrastructure risks. Our target yield models utilize robust risk-mitigation strategies, including algorithmic arbitrage and strict segregation of client capital. Past performance does not guarantee future results. We encourage all clients to invest responsibly and consult an independent financial advisor if they have any questions.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        7. Account Security
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        You are solely responsible for maintaining the confidentiality of your login credentials, password, and 2FA devices. We employ industry-leading security protocols to safeguard your digital assets.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        8. Use of Services &amp; Prohibited Conduct
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        You agree not to engage in any fraudulent activity, money laundering, or market manipulation. We reserve the right to terminate accounts engaged in prohibited conduct without notice.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        9. Fees &amp; Settlements
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        Mandate fees, performance fees, and settlement times are clearly presented on the Platform prior to mandate allocation. All fees are transparent and non-refundable once an allocation has been executed, except where required by law.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        10. Limitation of Liability
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        To the maximum extent permitted by law, Aetheris Capital Ltd. shall not be liable for any indirect, incidental, or consequential damages, including without limitation, loss of profits, data, or goodwill resulting from your use of the Platform.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        11. Indemnification
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        You agree to indemnify, defend, and hold harmless Aetheris Capital, its officers, and employees from any claims arising out of your violation of these Terms.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        12. Termination
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        We may suspend or terminate your access to the Platform at any time for violations of these Terms, suspicious activity, or risk management requirements. Upon termination, you may withdraw available funds subject to standard settlement periods.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        13. Dispute Resolution &amp; Governing Law
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        These Terms shall be governed and construed in accordance with the laws of Ireland. Any dispute arising out of these Terms shall be subject to the exclusive jurisdiction of the courts located in Dublin, Ireland.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        14. Amendments
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        We reserve the right to modify these Terms at any time. Material changes will be communicated via the Platform or email.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: "var(--gold-light)", fontSize: "0.82rem", display: "block", marginBottom: 2 }}>
                        15. Contact
                      </strong>
                      <p style={{ fontSize: "0.76rem", color: "var(--muted-light)", lineHeight: 1.5, margin: 0 }}>
                        For questions regarding these Terms, please contact:{" "}
                        <a href="mailto:aetheriscapital.support@gmail.com" style={{ color: "var(--gold-light)", textDecoration: "underline" }}>
                          aetheriscapital.support@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View: Institutional Consultation */}
              {drawerSubView === "consultation" && (
                <div className="drawer-subview-content">
                  <div>
                    <h3 className="drawer-subview-title">Institutional Consultation</h3>
                    <p className="drawer-subview-sub">
                      Connect directly with our desk for custom allocations or institutional onboarding.
                    </p>
                  </div>

                  <div className="drawer-sub-card" style={{ padding: 12 }}>
                    <LeadForm onLeadSubmitted={() => {}} />
                  </div>
                </div>
              )}

              <div className="drawer-footer">
                {profile ? (
                  <button
                    className="primary-btn drawer-cta"
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      onToggleDashboard();
                    }}
                  >
                    {showingDashboard ? "View Public Hub" : "Client Access"}
                  </button>
                ) : (
                  <>
                    <button
                      className="ghost-btn drawer-cta"
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        onOpenAuth("login");
                      }}
                    >
                      Client Login
                    </button>
                    <button
                      className="primary-btn drawer-cta"
                      type="button"
                      onClick={() => {
                        closeDrawer();
                        onOpenAuth("signup");
                      }}
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
      </header>

      {/* About Us Modal (Desktop) */}
      {isAboutOpen && (
        <div
          className="modal open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAboutOpen(false);
          }}
        >
          <div className="auth-box" style={{ maxWidth: 520, textAlign: "left" }}>
            <button
              className="close"
              type="button"
              onClick={() => setIsAboutOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>About {COMPANY.name}</h2>
            <p className="auth-sub">
              Institutional Digital-Asset Yield &amp; Corporate Governance
            </p>

            <div style={{ fontSize: "0.88rem", color: "var(--muted-light)", lineHeight: 1.6, margin: "16px 0" }}>
              <p style={{ marginBottom: 12 }}>
                Aetheris Capital Ltd. is a Dublin IFSC-based digital-asset investment firm providing fixed-term, risk-managed yield strategies to retail and institutional clients worldwide. Our quantitative strategies leverage systematic funding-rate arbitrage, cross-exchange liquidity spreads, and high-grade multi-signature cold custody to deliver consistent, risk-managed capital growth. We believe in transparency, security, and accessibility. Our mandate structures start at $100, ensuring that both first-time retail investors and large institutional allocators benefit from the same high-standard yield infrastructure and segregated wallet protection.
              </p>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 14px",
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                  marginTop: 14,
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--white)", marginBottom: 4 }}>
                  Registered Corporate Office
                </div>
                {ADDRESS_LINES.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                className="primary-btn"
                type="button"
                onClick={() => setIsAboutOpen(false)}
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Compliance Modal (Desktop) */}
      {isLegalOpen && (
        <div
          className="modal open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLegalOpen(false);
          }}
        >
          <div className="auth-box" style={{ maxWidth: 540, textAlign: "left" }}>
            <button
              className="close"
              type="button"
              onClick={() => setIsLegalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Legal &amp; Compliance</h2>
            <p className="auth-sub">
              Regulatory disclosures, risk framework &amp; institutional governance
            </p>

            <div style={{ fontSize: "0.85rem", color: "var(--muted-light)", lineHeight: 1.6, margin: "16px 0" }}>
              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: "var(--white)", fontSize: "0.88rem", display: "block", marginBottom: 4 }}>Institutional Governance Standard</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  Aetheris Capital operates strictly under institutional commercial standards, ensuring the highest level of fiduciary duty to our clients. Our custody framework employs strict segregation of client capital from corporate funds, utilizing multi-signature cold storage and audited algorithmic escrow protocols. This ensures that your capital is managed with the utmost transparency and integrity.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: "var(--white)", fontSize: "0.88rem", display: "block", marginBottom: 4 }}>AML, KYC &amp; Counter-Terrorist Financing</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  We adhere to international Anti-Money Laundering (AML) standards. While minor accounts enjoy low-friction access, mandates of $5,000 and above are subject to our stringent full KYC process. This includes comprehensive identity verification and source-of-funds documentation, ensuring a secure and trusted ecosystem for all high-value capital deployments.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong style={{ color: "var(--white)", fontSize: "0.88rem", display: "block", marginBottom: 4 }}>Digital Asset Risk Disclosure</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  Digital assets carry inherent market dynamics. Our target yield models leverage diverse strategies to mitigate risk and protect capital. While historical performance reflects our robust framework, it does not guarantee future returns. Aetheris Capital provides transparent reporting of underlying strategies, allowing our clients to make informed decisions with confidence.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                className="primary-btn"
                type="button"
                onClick={() => setIsLegalOpen(false)}
              >
                Acknowledge &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
