import { createFileRoute, redirect } from "@tanstack/react-router";
import { WalletsPage } from "../dashboard/pages/WalletsPage";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/wallets")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: WalletsRoute,
});

function WalletsRoute() {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">Loading wallets…</div>;
  if (!session) return null;
  return <WalletsPage />;
}
