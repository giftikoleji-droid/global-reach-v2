import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Dashboard } from "../dashboard/Dashboard";
import { PlanModal } from "../components/PlanModal";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardRoute,
});

function DashboardRoute() {
  const router = useRouter();
  const { session, profile, loading, logout } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">
        Loading portfolio…
      </div>
    );
  }
  if (!session) return null;

  return (
    <>
      <Dashboard
        profile={profile}
        onLogout={() => void logout()}
        onBrowsePlans={() => void router.navigate({ to: "/investments" })}
        onChoosePlan={(planId) => setSelectedPlanId(planId)}
      />
      {selectedPlanId && (
        <PlanModal
          planId={selectedPlanId}
          user={profile}
          onClose={() => setSelectedPlanId(null)}
          onCreated={() => {
            setSelectedPlanId(null);
            void router.invalidate();
          }}
          onRequireAuth={() => {
            setSelectedPlanId(null);
            void router.navigate({ to: "/login" });
          }}
        />
      )}
    </>
  );
}
