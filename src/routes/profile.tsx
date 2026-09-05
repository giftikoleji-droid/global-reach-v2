import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProfilePage } from "../dashboard/pages/ProfilePage";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: ProfileRoute,
});

function ProfileRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white">Loading profile…</div>;
  if (!session) return null;
  return <ProfilePage profile={profile} />;
}
