import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardHome } from "../dashboard/components/DashboardHome";
import { useClientPortfolio } from "../dashboard/hooks/useClientPortfolio";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/portfolio")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: PortfolioRoute,
});

function PortfolioRoute() {
  const { session, profile, loading } = useAuth();
  const portfolio = useClientPortfolio(session?.user?.id || profile?.id);

  if (loading || portfolio.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">Loading portfolio…</div>;
  }
  if (!session) return null;
  if (portfolio.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
        <div className="dashboard-error">
          <strong>We couldn't load your portfolio.</strong>
          <p>Please try again. Your authentication and account remain unchanged.</p>
          <button type="button" className="dashboard-button secondary" onClick={() => void portfolio.refresh()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="aetheris-dashboard">
      <main className="dashboard-main">
        <div className="dashboard-container">
          <DashboardHome
            profile={profile}
            activeInvestment={portfolio.activeInvestment}
            availableBalance={portfolio.balance.available_balance}
            transactions={portfolio.transactions}
            onExplore={() => portfolio.navigateTo("investments")}
            onViewInvestments={() => portfolio.navigateTo("investments")}
          />
        </div>
      </main>
    </div>
  );
}
