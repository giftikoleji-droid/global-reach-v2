import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { InvestmentsPage } from "../dashboard/pages/InvestmentsPage";
import { DashboardProvider } from "../dashboard/context/DashboardContext";
import { PlanModal } from "../components/PlanModal";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/investments")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: InvestmentsRoute,
});

function InvestmentsRoute() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">Loading investment mandates…</div>;
  if (!session) return null;

  return (
    <>
      <DashboardProvider initialRoute="investments">
        <InvestmentsPage
          activeInvestment={null}
          onChoosePlan={(planId) => setSelectedPlanId(planId)}
          onBack={() => void router.navigate({ to: "/dashboard" })}
        />
      </DashboardProvider>
      {selectedPlanId && (
        <PlanModal
          planId={selectedPlanId}
          user={profile}
          onClose={() => setSelectedPlanId(null)}
          onCreated={() => { setSelectedPlanId(null); void router.invalidate(); }}
          onRequireAuth={() => { setSelectedPlanId(null); void router.navigate({ to: "/login" }); }}
        />
      )}
    </>
  );
}
