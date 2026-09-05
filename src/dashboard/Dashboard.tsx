import { useAuth } from "../lib/AuthContext";
import type { Investment, Profile } from "../lib/aetheris";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { DashboardHeader } from "./components/DashboardHeader";
import { BottomNav } from "./components/BottomNav";
import { DashboardHome } from "./components/DashboardHome";
import { InvestmentsPage } from "./pages/InvestmentsPage";
import { WalletsPage } from "./pages/WalletsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReferralsPage } from "./pages/ReferralsPage";
import { useClientPortfolio } from "./hooks/useClientPortfolio";
import "./dashboard.css";

export interface DashboardProps {
  profile: Profile | null;
  investments?: Investment[];
  onLogout: () => void;
  onBrowsePlans: () => void;
  // exactOptionalPropertyTypes: allow explicit undefined assignment
  onChoosePlan?: ((planId: string) => void) | undefined;
}

function routeFromPath(): "dashboard" | "investments" | "wallets" | "referrals" | "profile" {
  const path = window.location.pathname;
  if (path === "/investments") return "investments";
  if (path === "/wallets") return "wallets";
  if (path === "/referrals") return "referrals";
  if (path === "/profile") return "profile";
  return "dashboard";
}

export function Dashboard({ profile, onLogout, onBrowsePlans, onChoosePlan }: DashboardProps) {
  const { user } = useAuth();
  // Prefer authenticated user id; fall back to profile id when present
  const userId: string | undefined = user?.id ?? profile?.id ?? undefined;

  return (
    <DashboardProvider initialRoute={routeFromPath()}>
      <DashboardShell
        profile={profile}
        userId={userId}
        onLogout={onLogout}
        onBrowsePlans={onBrowsePlans}
        onChoosePlan={onChoosePlan}
      />
    </DashboardProvider>
  );
}

function DashboardShell({
  profile,
  userId,
  onLogout,
  onBrowsePlans,
  onChoosePlan,
}: {
  profile: Profile | null;
  userId: string | undefined;
  onLogout: () => void;
  onBrowsePlans: () => void;
  onChoosePlan?: ((planId: string) => void) | undefined;
}) {
  const { route } = useDashboard();
  const portfolio = useClientPortfolio(userId);

  return (
    <div className="aetheris-dashboard">
      <DashboardHeader profile={profile} onLogout={onLogout} />
      <main className="dashboard-main">
        <div className="dashboard-container">
          {portfolio.loading ? (
            <div className="dashboard-state" role="status">
              Loading your portfolio…
            </div>
          ) : portfolio.error ? (
            <div className="dashboard-error">
              <strong>We couldn&apos;t load your portfolio.</strong>
              <p>Please try again. Your authentication and account remain unchanged.</p>
              <button
                type="button"
                className="dashboard-button secondary"
                onClick={() => void portfolio.refresh()}
              >
                Try again
              </button>
            </div>
          ) : route === "dashboard" ? (
            <DashboardHome
              profile={profile}
              activeInvestment={portfolio.activeInvestment}
              availableBalance={portfolio.balance.available_balance}
              transactions={portfolio.transactions}
              onExplore={() => portfolio.navigateTo("investments")}
              onViewInvestments={() => portfolio.navigateTo("investments")}
            />
          ) : route === "investments" ? (
            <InvestmentsPage
              activeInvestment={portfolio.activeInvestment}
              {...(onChoosePlan ? { onChoosePlan } : {})}
              onBack={() => portfolio.navigateTo("dashboard")}
            />
          ) : route === "wallets" ? (
            <WalletsPage />
          ) : route === "referrals" ? (
            <ReferralsPage profile={profile} />
          ) : (
            <ProfilePage profile={profile} />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
