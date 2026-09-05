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
  resolvePlan,
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
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
    void loadAllData();
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCreditPayout = async (inv: Investment) => {
    const plan = resolvePlan(inv.plan_id || inv.plan_name);
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
          "success",
        );
        await loadAllData();
        if (onRefreshData) onRefreshData();
      }
    } catch (err: unknown) {
      showToast(
        (err instanceof Error ? err.message : String(err)) ||
          "Failed to credit payout to client account.",
        "error",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const metrics = useMemo(() => {
    const totalManaged = investments.reduce(
      (sum, i) => sum + Number(i.amount_invested || i.amount || 0),
      0,
    );
    const activeMandates = investments.filter((i) => i.status === "active").length;
    const maturedMandates = investments.filter(
      (i) => i.status === "matured" || i.status === "completed",
    ).length;
    const pendingMandates = investments.filter((i) => i.status === "pending").length;
    const totalPayoutsDistributed = investments
      .filter((i) => i.status === "matured" || i.status === "completed")
      .reduce(
        (sum, i) =>
          sum +
          Number(
            i.current_value ||
              Number(i.amount_invested || i.amount || 0) * (1 + (i.return_pct || 8) / 100),
          ),
        0,
      );

    return {
      totalManaged,
      activeMandates,
      maturedMandates,
      pendingMandates,
      totalPayoutsDistributed,
    };
  }, [investments]);

  if (!isAdminUser) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="rounded-2xl p-8 bg-[#0d1938] border border-rose-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-5">
            <ShieldAlert size={32} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            <span>Restricted Access · Admin Desk Only</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Institutional Admin Clearance Required
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
            You are currently authenticated as{" "}
            <span className="text-[#D4AF37] font-semibold">
              {currentProfile?.email || "Guest Client"}
            </span>{" "}
            (Role: {currentProfile?.role || "client"}).
          </p>
          <button
            type="button"
            onClick={() => setAdminBypass(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0a1128] font-bold text-xs uppercase tracking-wider"
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
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-md max-w-md flex items-start gap-3 ${
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

      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0d1938] via-[#0f1c3f] to-[#13244e] border border-[rgba(212,175,55,0.3)] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck size={13} />
                <span>Super Admin Desk · Settlement Authority</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Investment Mandates & Manual Payout Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Profit is never calculated or credited automatically. Admin credits client balance on
              maturity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAllData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#D4AF37]" : ""} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Capital In Escrow
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            {formatUSD(metrics.totalManaged)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Active Mandates
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] tabular-nums">
            {metrics.activeMandates}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Matured (Paid Out)
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums">
            {metrics.maturedMandates}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0d1938] border border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Payouts Credited
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            {formatUSD(metrics.totalPayoutsDistributed)}
          </div>
        </div>
      </div>

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
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "active", "matured", "pending"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#D4AF37] text-[#0a1128]"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#0d1938] border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-[#D4AF37]" />
            <h2 className="text-base font-bold text-white">
              Client Investments Ledger ({filteredInvestments.length})
            </h2>
          </div>
        </div>

        {filteredInvestments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Clock size={32} className="mx-auto text-slate-600" />
            <div className="text-sm font-semibold text-white">No investment records found</div>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {filteredInvestments.map((inv) => {
              const plan = resolvePlan(inv.plan_id || inv.plan_name);
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
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0f1c3f] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#D4AF37] shrink-0">
                      <DollarSign size={20} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {inv.plan_name} Mandate
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadgeClass(inv.status)}`}
                        >
                          {inv.status}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          +{returnPct}% in {inv.term_days || plan.termDays}d
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Client:{" "}
                          <strong className="text-white">
                            {inv.user_email || inv.user_id.slice(0, 8) + "..."}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Start:{" "}
                          <span className="text-slate-400">{formatDate(inv.start_date)}</span>
                        </span>
                        <span>·</span>
                        <span>
                          Maturity:{" "}
                          <span className="text-[#D4AF37] font-medium">
                            {formatDate(inv.end_date || inv.maturity_date || "")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4">
                    <div className="text-left lg:text-right space-y-0.5">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">
                        Capital / Total Payout
                      </div>
                      <div className="flex items-center gap-2 lg:justify-end">
                        <span className="text-sm font-semibold text-slate-300">
                          {formatUSD(capital)}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="text-base font-extrabold text-white tabular-nums">
                          {formatUSD(totalPayout)}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400">Yield: {formatUSD(profit)}</div>
                    </div>

                    {!isMatured ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleCreditPayout(inv)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0a1128] text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                      >
                        <Coins size={14} />
                        {isBusy ? "Crediting…" : "Credit Payout"}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 size={14} />
                        Credited
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 text-xs text-slate-400 flex items-start gap-2">
        <Info size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          Payouts require explicit admin action. Crediting marks the mandate as{" "}
          <code className="text-emerald-400">matured</code>.
        </div>
      </div>
    </div>
  );
}
