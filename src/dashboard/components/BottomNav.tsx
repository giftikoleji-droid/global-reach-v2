import { BriefcaseBusiness, LayoutDashboard, UserRound, WalletCards } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";

export function BottomNav() {
  const { route, navigate } = useDashboard();
  const items = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["investments", "Investments", BriefcaseBusiness],
    ["wallets", "Wallets", WalletCards],
    ["profile", "Account", UserRound],
  ] as const;
  return (
    <nav className="dashboard-bottom-nav" aria-label="Mobile navigation">
      {items.map(([key, label, Icon]) => (
        <button key={key} type="button" className={route === key ? "active" : ""} onClick={() => navigate(key)}>
          <Icon size={20} strokeWidth={route === key ? 2.4 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
