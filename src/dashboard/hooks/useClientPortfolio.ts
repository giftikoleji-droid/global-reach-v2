import { useCallback, useEffect, useState } from "react";
import { db, type Balance, type Investment, type Transaction } from "../../lib/aetheris";
import { useDashboard } from "../context/DashboardContext";

export function useClientPortfolio(userId?: string) {
  const { navigate } = useDashboard();
  const [balance, setBalance] = useState<Balance>({ user_id: userId || "", available_balance: 0 });
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setBalance({ user_id: "", available_balance: 0 });
      setInvestments([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [available, invs, txs] = await Promise.all([
        db.getBalance(userId),
        db.getInvestments(userId),
        db.getTransactions(userId),
      ]);
      setBalance({ user_id: userId, available_balance: Number(available || 0) });
      setInvestments(invs || []);
      setTransactions((txs || []).slice(0, 5));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load portfolio data.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const activeInvestment = investments.find((item) => {
    const status = String(item.status || "").trim().toLowerCase();
    return status === "active";
  }) || null;

  return {
    balance,
    investments,
    activeInvestment,
    transactions,
    loading,
    error,
    refresh: load,
    navigateTo: navigate,
  };
}
