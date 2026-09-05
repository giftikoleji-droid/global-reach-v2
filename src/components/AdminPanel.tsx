import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Coins,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  TrendingUp,
  Wallet,
  Sparkles,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Info,
} from "lucide-react";
import {
  type Investment,
  type Profile,
  type Transaction,
  COMPANY,
  PLANS,
  db,
  formatCurrency,
  formatUSD,
  formatDate,
  formatDateTime,
  statusBadgeClass,
} from "../lib/aetheris";

interface AdminPanelProps {
  currentProfile: Profile | null;
  onRefreshData?: () => void;
}

export function AdminPanel({ currentProfile, onRefreshData }: AdminPanelProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "matured">("all");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Demo Admin Toggle in case user tests with client session
  const [adminBypass, setAdminBypass] = useState(false);

  const isAdminUser = useMemo(() => {
    if (adminBypass) return true;
    return db.isAdmin(currentProfile);
  }, [currentProfile, adminBypass]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await db.getAllInvestments();
      setInvestments(data);
    } catch (err) {
      console.error("Error loading admin investments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quick auto-dismiss toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // ─── CRITICAL ACTION: CREDIT PAYOUT (Admin Manual Execution) ───
  const handleCreditPayout = async (inv: Investment) => {
    const plan = PLANS.find((p) => p.name.toLowerCase() === inv.plan_name.toLowerCase() || p.id === inv.plan_id) || PLANS[0];
    const capital = Number(inv.amount_invested || inv.amount || 0);
    const returnPct = Number(inv.return_pct || plan.returnPct);
    const profit = Math.round(capital * (returnPct / 100));
    const totalPayout = capital + profit;

    setActionLoadingId(inv.id);
    try {
      const result = await db.creditPayout({
        investmentId: inv.id,
        userId: inv.user_id,
        amountInvested: capital,
        profit: profit,
        planName: inv.plan_name,
      });

      if (result.success) {
        showToast(
          `Payout Credited Successfully! ${formatUSD(totalPayout)} added to client balance (${formatUSD(capital)} principal + ${formatUSD(profit)} yield). Investment marked as matured.`,
          "success"
        );
        await loadAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to credit payout to client account.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered investments list
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "matured"
          ? inv.status === "matured" || inv.status === "completed"
          : inv.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inv.plan_name.toLowerCase().includes(q) ||
        inv.user_id.toLowerCase().includes(q) ||
        (inv.user_email && inv.user_email.toLowerCase().includes(q)) ||
        (inv.tx_hash && inv.tx_hash.toLowerCase().includes(q)) ||
        (inv.wallet_address && inv.wallet_address.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [investments, statusFilter, searchQuery]);

  // Aggregate Admin Metrics
  const metrics = useMemo(() => {
    const totalManaged = investments.reduce((sum, i) => sum + Number(i.amount_invested || i.amount || 0), 0);
    const activeMandates = investments.filter((i) => i.status === "active").length;
    const maturedMandates = investments.filter((i) => i.status === "matured" || i.status === "completed").length;
    const pendingMandates = investments.filter((i) => i.status === "pending").length;

    const totalPayoutsDistributed = investments
      .filter((i) => i.status === "matured" || i.status === "completed")
      .reduce((sum, i) => sum + Number(i.current_value || (Number(i.amount_invested || i.amount || 0) * (1 + (i.return_pct || 8) / 100))), 0);

    return {
      totalManaged,
      activeMandates,
      maturedMandates,
      pendingMandates,
      totalPayoutsDistributed,
    };
  }, [investments]);

  // ─── SECURITY ACCESS GUARD ───
  if (!isAdminUser) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="rounded-2xl p-8 bg-[#0d1938] border border-rose-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <ShieldAlert size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            <span>Restricted Access · Admin Desk Only</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 font-['Inter']">
            Institutional Admin Clearance Required
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
            This module contains privileged ledger settlement controls and manual balance crediting tools. You are currently authenticated as{" "}
            <span className="text-[#D4AF37] font-semibold">{currentProfile?.email || "Guest Client"}</span> (Role: {currentProfile?.role || "client"}).
          </p>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 max-w-md mx-auto text-xs text-slate-400 text-left mb-6 space-y-2">
            <div className="font-semibold text-white">Authorized Admin Accounts:</div>
            <div className="font-mono text-[#D4AF37]">· giftese911@gmail.com</div>
            <div className="font-mono text-[#D4AF37]">· aetheriscapital.support@gmail.com</div>
          </div>

          <button
            type="button"
            onClick={() => setAdminBypass(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0a1128] font-bold text-xs uppercase tracking-wider hover:bg-[#E6C45A] transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            <ShieldCheck size={16} />
            <span>Switch to Admin View (Dev Evaluation Mode)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* ─── Toast Notification ─── */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-md max-w-md flex items-start gap-3 transition-all animate-in fade-in duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-medium leading-relaxed">{toastMessage.text}</div>
        </div>
      )}

      {/* ─── Admin Header & Governance Banner ─── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0d1938] via-[#0f1c3f] to-[#13244e] border border-[rgba(212,175,55,0.3)] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck size={13} />
                <span>Super Admin Desk · Settlement Authority</span>
              </div>
              <span className="text-xs text-slate-400">| Manual Balance Crediting Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Inter']">
              Investment Mandates & Manual Payout Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Strict Architecture: Profit is NEVER calculated or credited automatically. Admin manually credits client balance upon investment maturity.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#D4AF37]" : ""} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Capital In Escrow
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums font-['Inter']">
            {formatUSD(metrics.totalManaged)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-[#D4AF37]" />
            <span>Across all institutional plans</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Active Mandates
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] tabular-nums font-['Inter']">
            {metrics.activeMandates}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Yield generating & awaiting maturity
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Matured (Paid Out)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums font-['Inter']">
            {metrics.maturedMandates}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Credited directly to client balance
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Payouts Credited
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums font-['Inter']">
            {formatUSD(metrics.totalPayoutsDistributed)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            Principal + agreed yield released
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0d1938] border border-white/10">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client ID, email, plan name or wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "matured", "pending"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#D4AF37] text-[#0a1128] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Mandates Table / Card View ─── */}
      <div className="rounded-2xl bg-[#0d1938] border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-[#D4AF37]" />
            <h2 className="text-base font-bold text-white font-['Inter']">
              Client Investments Ledger ({filteredInvestments.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">Click &quot;Credit Payout&quot; to credit balance on maturity</span>
        </div>

        {filteredInvestments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Clock size={32} className="mx-auto text-slate-600" />
            <div className="text-sm font-semibold text-white">No investment records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No active or matured investment mandates match your current query or filter parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {filteredInvestments.map((inv) => {
              const plan = PLANS.find((p) => p.name.toLowerCase() === inv.plan_name.toLowerCase() || p.id === inv.plan_id) || PLANS[0];
              const capital = Number(inv.amount_invested || inv.amount || 0);
              const returnPct = Number(inv.return_pct || plan.returnPct);
              const profit = Math.round(capital * (returnPct / 100));
              const totalPayout = capital + profit;
              const isMatured = inv.status === "matured" || inv.status === "completed";
              const isBusy = actionLoadingId === inv.id;

              return (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Plan, User, & Strategy Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0f1c3f] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                      <DollarSign size={20} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm font-['Inter']">
                          {inv.plan_name} Mandate
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(inv.status)}`}>
                          {inv.status}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          +{returnPct}% in {inv.term_days || plan.termDays}d
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Client: <strong className="text-white">{inv.user_email || inv.user_id.slice(0, 8) + "..."}</strong></span>
                        <span>·</span>
                        <span>Start: <span className="text-slate-400">{formatDate(inv.start_date)}</span></span>
                        <span>·</span>
                        <span>Maturity: <span className="text-[#D4AF37] font-medium">{formatDate(inv.end_date || inv.maturity_date || "")}</span></span>
                      </div>

                      {inv.wallet_address && (
                        <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                          Payout Wallet: {inv.wallet_address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Financial Figures & Gold "Credit Payout" Button */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    <div className="text-left lg:text-right space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">
                        Capital / Total Payout
                      </div>
                      <div className="flex items-center gap-2 lg:justify-end">
                        <span className="text-sm font-semibold text-slate-300">{formatUSD(capital)}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-base font-extrabold text-white tabular-nums font-['Inter']">
                          {formatUSD(totalPayout)}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        Profit Yield: +{formatUSD(profit)}
                      </div>
                    </div>

                    {/* Gold Action Button */}
                    <div className="shrink-0">
                      {isMatured ? (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 size={15} />
                          <span>Payout Credited</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCreditPayout(inv)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E6C45A] text-[#0a1128] font-bold text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.45)] transition-all transform active:scale-95 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : (
                            <Coins size={15} className="text-[#0a1128]" />
                          )}
                          <span>Credit Payout</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Governance Notice Footer ─── */}
      <div className="p-4 rounded-xl bg-[#0f1c3f] border border-[rgba(212,175,55,0.2)] text-xs text-slate-300 flex items-start gap-3">
        <Info size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Escrow & Settlement Policy:</strong> When &quot;Credit Payout&quot; is clicked, the system adds the full principal plus contractual fixed yield directly to the client&apos;s <code className="text-[#D4AF37]">available_balance</code>, records a verified <code className="text-[#D4AF37]">payout</code> transaction in the audit ledger, and marks the mandate status as <code className="text-emerald-400">matured</code>.
        </div>
      </div>
    </div>
  );
}
