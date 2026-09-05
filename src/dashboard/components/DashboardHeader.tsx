import { Bell, ChevronDown, Gift, LogOut, Menu, UserRound, X } from "lucide-react";
import { COMPANY, type Profile } from "../../lib/aetheris";
import { useDashboard } from "../context/DashboardContext";

export function DashboardHeader({
  profile,
  onLogout,
}: {
  profile: Profile | null;
  onLogout: () => void;
}) {
  const { route, navigate, mobileOpen, setMobileOpen } = useDashboard();
  const nav = [
    ["dashboard", "Dashboard"],
    ["investments", "Investments / Plans"],
    ["wallets", "Wallets"],
    ["referrals", "Refer & Earn"],
    ["profile", "Profile / Account"],
  ] as const;

  const handleLogout = () => {
    setMobileOpen(false);
    onLogout();
  };

  return (
    <>
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <button
            type="button"
            className="dashboard-brand"
            onClick={() => navigate("dashboard")}
            aria-label="Open dashboard"
          >
            <span className="dashboard-brand-mark">AE</span>
            <span className="dashboard-brand-copy">
              <strong>{COMPANY.name}</strong>
              <small>Global Institutional Desk</small>
            </span>
          </button>

          <nav className="dashboard-desktop-nav" aria-label="Client navigation">
            {nav.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={route === key ? "active" : ""}
                onClick={() => navigate(key)}
              >
                {key === "referrals" && <Gift size={16} aria-hidden="true" />} {label}
              </button>
            ))}
          </nav>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="dashboard-icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={21} />
            </button>
            <div className="dashboard-user-chip">
              <span className="dashboard-avatar">
                <UserRound size={17} />
              </span>
              <span className="dashboard-user-name">{profile?.name || "Client"}</span>
              <ChevronDown size={15} />
            </div>
            <button
              type="button"
              className="dashboard-logout dashboard-desktop-logout"
              onClick={handleLogout}
              aria-label="Log out"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 44,
                padding: "0 13px",
                flexShrink: 0,
                visibility: "visible",
                opacity: 1,
              }}
            >
              <LogOut size={17} />
              <span>Logout</span>
            </button>
            <button
              type="button"
              className="dashboard-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={25} />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="dashboard-drawer-layer">
          <button
            className="dashboard-drawer-backdrop"
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="dashboard-drawer" aria-label="Mobile client navigation">
            <div className="dashboard-drawer-top">
              <div className="dashboard-brand-copy">
                <strong>{COMPANY.name}</strong>
                <small>Global Institutional Desk</small>
              </div>
              <button
                type="button"
                className="dashboard-icon-button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="dashboard-drawer-client">
              <span className="dashboard-avatar">
                <UserRound size={18} />
              </span>
              <div>
                <strong>{profile?.name || "Client"}</strong>
                <small>{profile?.email || "Authenticated client"}</small>
              </div>
            </div>
            <nav className="dashboard-drawer-nav">
              {nav.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={route === key ? "active" : ""}
                  onClick={() => navigate(key)}
                >
                  {key === "referrals" && <Gift size={18} aria-hidden="true" />} {label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              className="dashboard-logout"
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                minHeight: 48,
                gap: 10,
                visibility: "visible",
                opacity: 1,
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
