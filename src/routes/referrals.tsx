import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReferralsPage } from "../dashboard/pages/ReferralsPage";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/referrals")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: ReferralsRoute,
});

function ReferralsRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">Loading referrals…</div>;
  if (!session) return null;
  return <ReferralsPage profile={profile} />;
}
