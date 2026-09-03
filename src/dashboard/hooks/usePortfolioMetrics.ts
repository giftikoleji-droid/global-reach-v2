import type { Investment } from "../../lib/aetheris";

export function investmentCapital(investment: Investment | null) {
  return Number(investment?.amount_invested ?? investment?.amount ?? 0);
}

export function investmentValue(investment: Investment | null) {
  if (!investment) return 0;
  const capital = investmentCapital(investment);
  return Number(investment.current_value ?? capital);
}

export function portfolioChangePct(investment: Investment | null) {
  const capital = investmentCapital(investment);
  if (!investment || capital <= 0) return 0;
  return ((investmentValue(investment) - capital) / capital) * 100;
}

export function projectedMaturityPayout(investment: Investment | null) {
  if (!investment) return 0;
  const capital = investmentCapital(investment);
  return Number(investment.expected_return ?? capital);
}

export function dailyYield(investment: Investment | null) {
  if (!investment) return 0;
  const explicit = Number((investment as Investment & { daily_yield?: number }).daily_yield);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const capital = investmentCapital(investment);
  const payout = projectedMaturityPayout(investment);
  return Math.max(0, payout - capital) / Math.max(1, Number(investment.term_days || 1));
}

export function getInvestmentProgress(investment: Investment | null) {
  const total = Math.max(1, Number(investment?.term_days || 1));
  if (!investment?.start_date) return { day: 0, total, percent: 0, remaining: total };
  const start = new Date(investment.start_date).getTime();
  const end = new Date(investment.end_date || investment.maturity_date || start + total * 86400000).getTime();
  const now = Date.now();
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000) + 1);
  const day = Math.min(total, elapsed);
  const percent = Math.min(100, Math.max(0, ((now - start) / Math.max(1, end - start)) * 100));
  const remaining = Math.max(0, Math.ceil((end - now) / 86400000));
  return { day, total, percent, remaining };
}

export function usePortfolioMetrics(investment: Investment | null, availableBalance: number) {
  const invested = investmentCapital(investment);
  const current = investmentValue(investment);
  const profit = current - invested;
  return {
    active: investment,
    invested,
    current,
    profit,
    available: Number(availableBalance || 0),
    portfolio: current + Number(availableBalance || 0),
    changePct: portfolioChangePct(investment),
    todayYield: dailyYield(investment),
    maturityPayout: projectedMaturityPayout(investment),
  };
}
