import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { COMPANY, type Profile } from "../../lib/aetheris";

export function ProfilePage({ profile }: { profile: Profile | null }) {
  return <div className="dashboard-page"><header className="dashboard-page-heading"><div><div className="dashboard-eyebrow">Account</div><h1>Profile & Account</h1><p>Your authenticated Aetheris Capital client profile.</p></div></header><section className="dashboard-card profile-card"><div className="profile-hero"><div className="profile-avatar"><UserRound size={30}/></div><div><h2>{profile?.name || "Client"}</h2><p>{profile?.email || "Authenticated account"}</p></div><span className="verified-pill"><ShieldCheck size={15}/> Authenticated</span></div><div className="profile-fields"><div><span>Name</span><strong>{profile?.name || "—"}</strong></div><div><span>Email</span><strong>{profile?.email || "—"}</strong></div><div><span>Client status</span><strong>Active client</strong></div><div><span>Support</span><strong>{COMPANY.email}</strong></div></div><a className="support-link" href={`mailto:${COMPANY.email}`}><Mail size={17}/> Contact Client Desk</a></section></div>;
}
