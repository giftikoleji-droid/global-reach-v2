import {
  BadgeCheck,
  Check,
  Copy,
  Gift,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "../../lib/aetheris";
import { supabase } from "../../lib/supabase";

export function ReferralsPage({ profile }: { profile: Profile | null }) {
  const [copied, setCopied] = useState(false);
  const [referredCount, setReferredCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const refCode = profile?.ref_code || "AETHCLIENT";
  const appBase = (
    (import.meta.env["VITE_PUBLIC_APP_URL"] as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");
  const referralLink = `${appBase}/?ref=${encodeURIComponent(refCode)}&utm_source=referral`;

  useEffect(() => {
    let cancelled = false;

    async function loadReferralStats() {
      if (!profile?.id) {
        setReferredCount(0);
        setVerifiedCount(0);
        return;
      }

      const { data, error } = await supabase
        .from("referrals")
        .select("referred_user_id")
        .eq("referrer_id", profile.id);

      if (cancelled) return;
      if (error) {
        console.warn("Unable to load referral statistics:", error.message);
        setReferredCount(0);
        setVerifiedCount(0);
        return;
      }

      const ids = Array.from(
        new Set((data ?? []).map((row) => row.referred_user_id).filter(Boolean)),
      );
      setReferredCount(ids.length);

      if (!ids.length) {
        setVerifiedCount(0);
        return;
      }

      const { data: investments, error: investmentError } = await supabase
        .from("investments")
        .select("user_id")
        .in("user_id", ids)
        .in("status", ["active", "matured", "completed"]);

      if (cancelled) return;
      if (investmentError) {
        console.warn("Unable to load verified referral statistics:", investmentError.message);
        setVerifiedCount(0);
        return;
      }

      setVerifiedCount(new Set((investments ?? []).map((row) => row.user_id).filter(Boolean)).size);
    }

    void loadReferralStats();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Aetheris Capital",
          text: "Explore Aetheris Capital with my referral link.",
          url: referralLink,
        });
      } catch {
        /* cancelled */
      }
    } else {
      await copyLink();
    }
  }

  const benefits = [
    {
      icon: Sparkles,
      title: "Up to 15.6% APY",
      text: "Earn enhanced yield on every qualified referral you bring in.",
    },
    {
      icon: BadgeCheck,
      title: "Tailored Portfolio Management",
      text: "Referred clients receive a dedicated, managed mandate.",
    },
    {
      icon: WalletCards,
      title: "Quarterly Revenue Share",
      text: "Participate in recurring revenue distributions each quarter.",
    },
  ];

  return (
    <div className="dashboard-page referrals-page">
      <section className="referral-hero">
        <div className="referral-hero-inner">
          <div className="referral-hero-icon">
            <Gift size={26} />
          </div>
          <div>
            <div className="dashboard-eyebrow">Refer &amp; Earn</div>
            <h1>Invite Your Network. Earn Passive Yield.</h1>
            <p>
              Share Aetheris Capital with friends, family, or colleagues and earn alongside them
              through our global referral program.
            </p>
          </div>
        </div>
        <div className="referral-hero-badge">
          <ShieldCheck size={14} /> Exclusive client program
        </div>
      </section>

      <section className="dashboard-card referral-link-card">
        <div className="dashboard-eyebrow">Your referral link</div>
        <h2>Share this link with your network</h2>
        <div className="referral-link-box" title={referralLink}>
          {referralLink}
        </div>
        <div className="referral-link-actions">
          <button
            type="button"
            className="dashboard-button secondary"
            onClick={() => void copyLink()}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Link
              </>
            )}
          </button>
          <button
            type="button"
            className="dashboard-button primary"
            onClick={() => void shareLink()}
          >
            <Share2 size={16} /> Share
          </button>
        </div>
        <p className="referral-link-note">
          {copied
            ? "Referral link copied to your clipboard."
            : "Your personal referral code is attached automatically."}
        </p>
      </section>

      <section className="dashboard-stat-grid">
        <div className="dashboard-card referral-stat">
          <WalletCards size={19} />
          <span>Referral Bonus</span>
          <strong>${Number(profile?.bonus_earned || 0).toFixed(2)}</strong>
          <small>Current balance</small>
        </div>
        <div className="dashboard-card referral-stat">
          <Users size={19} />
          <span>Referred Clients</span>
          <strong>{referredCount}</strong>
          <small>Clients referred</small>
        </div>
        <div className="dashboard-card referral-stat">
          <ShieldCheck size={19} />
          <span>Verified Clients</span>
          <strong>{verifiedCount}</strong>
          <small>Clients who invested</small>
        </div>
      </section>

      <section className="dashboard-card referral-benefits-card">
        <div className="dashboard-eyebrow">Why refer?</div>
        <h2>Simple benefits. Clear value.</h2>
        <div className="referral-benefits-grid">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className="referral-benefit">
              <div className="referral-benefit-icon">
                <Icon size={17} />
              </div>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
