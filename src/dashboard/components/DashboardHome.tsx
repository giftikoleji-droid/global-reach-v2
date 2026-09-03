import { ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, ChevronRight, Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatDate, formatDateTime, formatUSD, type Investment, type Profile, type Transaction } from "../../lib/aetheris";
import { getInvestmentProgress, usePortfolioMetrics } from "../hooks/usePortfolioMetrics";

const money = (value: number) => formatUSD(value, 2);

export function DashboardHome({
  profile,
  activeInvestment,
  availableBalance,
  transactions,
  onExplore,
  onViewInvestments,
}: {
  profile: Profile | null;
  activeInvestment: Investment | null;
  availableBalance: number;
  transactions: Transaction[];
  onExplore: () => void;
  onViewInvestments: () => void;
}) {
  const metrics = usePortfolioMetrics(activeInvestment, availableBalance);
  const progress = getInvestmentProgress(activeInvestment);
  const isMatured = activeInvestment?.status === "matured" || activeInvestment?.status === "completed" || progress.percent >= 100;
  const [hidden, setHidden] = useState(false);

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-heading">
        <div>
          <div className="dashboard-eyebrow">Portfolio Overview</div>
          <h1>Investment Portfolio</h1>
          <p>Track your mandate, performance and earnings in one place.</p>
        </div>
        <div className="dashboard-greeting">Welcome back, <strong>{profile?.name || "Client"}</strong></div>
      </header>

      <section className="portfolio-hero-card">
        <div className="portfolio-hero-top">
          <div>
            <div className="dashboard-label-row"><span>TOTAL PORTFOLIO VALUE</span><button type="button" className="visibility-button" onClick={() => setHidden((value) => !value)} aria-label={hidden ? "Show portfolio value" : "Hide portfolio value"}>{hidden ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
            <div className="portfolio-total">{hidden ? "••••••" : money(metrics.portfolio)}</div>
            <div className="portfolio-subvalue">{activeInvestment ? "Active mandate + available balance" : "No active mandate"}</div>
          </div>
          <div className="portfolio-change">
            <span>PORTFOLIO CHANGE</span>
            <strong className={metrics.changePct >= 0 ? "positive" : "negative"}>{metrics.changePct >= 0 ? "+" : ""}{metrics.changePct.toFixed(2)}% <ArrowUpRight size={20} /></strong>
            <small>vs. capital invested</small>
          </div>
        </div>
        <div className="portfolio-divider" />
        <div className="portfolio-stat-row">
          <MiniStat title="TOTAL INVESTED" value={money(metrics.invested)} />
          <MiniStat title="TOTAL PROFIT" value={`${metrics.profit >= 0 ? "+" : "-"}${money(Math.abs(metrics.profit))}`} positive={metrics.profit > 0} />
          <MiniStat title="AVAILABLE BALANCE" value={money(metrics.available)} />
        </div>
      </section>

      {activeInvestment ? (
        <section className="active-mandate-card">
          <div className="section-heading-row">
            <div>
              <div className="dashboard-eyebrow">Active Investment</div>
              <h2>{activeInvestment.plan_name} Plan</h2>
            </div>
            <span className="active-badge" style={{ color: isMatured ? "#10B981" : "#D4AF37", borderColor: isMatured ? "rgba(16,185,129,.35)" : "rgba(212,175,55,.35)", background: isMatured ? "rgba(16,185,129,.10)" : "rgba(212,175,55,.10)", whiteSpace: "nowrap" }}>{isMatured ? "MATURED" : "ACTIVE"}</span>
          </div>

          <div className="mandate-overview">
            <div className="mandate-icon"><TrendingUp size={26} /></div>
            <div className="mandate-name"><span>Current mandate</span><strong>{activeInvestment.plan_name}</strong><small>{activeInvestment.return_pct}% target · {activeInvestment.term_days} days</small></div>
            <div className="mandate-value"><span>Current Value</span><strong className={metrics.current > metrics.invested ? "positive" : ""}>{money(metrics.current)}</strong></div>
          </div>

          <div className="mandate-metrics">
            <MetricBlock title="Capital Invested" value={money(metrics.invested)} />
            <MetricBlock title="Current Value" value={money(metrics.current)} positive={metrics.current > metrics.invested} />
          </div>

          <div className="progress-panel">
            <div className="progress-header"><span>MANDATE PROGRESS</span><strong>Day {progress.day} of {progress.total}</strong></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percent}%`, background: isMatured ? "#10B981" : "#D4AF37" }} /></div>
            <div className="progress-footer"><span>{progress.remaining ? `${progress.remaining} days remaining` : "Maturity reached"}</span><span>{activeInvestment.end_date || activeInvestment.maturity_date ? `Matures ${formatDate(activeInvestment.end_date || activeInvestment.maturity_date!)}` : "Maturity date pending"}</span></div>
          </div>

          <div className="yield-grid">
            <MetricBlock title="Today's Yield" value={`+${money(metrics.todayYield)}`} positive />
            <MetricBlock title="Projected Maturity Payout" value={money(metrics.maturityPayout)} />
          </div>
        </section>
      ) : (
        <section className="empty-mandate-card">
          <div className="empty-icon"><BriefcaseBusiness size={28} /></div>
          <div className="dashboard-eyebrow">Portfolio Ready</div>
          <h2>You don't have an active mandate yet.</h2>
          <p>Choose one of the four Aetheris Capital mandates to begin building your portfolio.</p>
          <button type="button" className="dashboard-button primary" onClick={onExplore}>Explore Investment Plans</button>
        </section>
      )}

      <section className="activity-card">
        <div className="section-heading-row">
          <div><div className="dashboard-eyebrow">Account Ledger</div><h2>Recent Activity</h2></div>
          <button type="button" className="text-action" onClick={onViewInvestments}>View Investments <ChevronRight size={16} /></button>
        </div>
        {transactions.length ? (
          <div className="activity-list">{transactions.map((tx) => <ActivityRow key={tx.id} transaction={tx} />)}</div>
        ) : (
          <div className="activity-empty">No recent activity yet.</div>
        )}
      </section>
    </div>
  );
}

function MiniStat({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return <div className="portfolio-mini-stat"><span>{title}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}

function MetricBlock({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  return <div className="metric-block"><span>{title}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}

function ActivityRow({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === "payout";
  const signed = `${isCredit ? "+" : "-"}${money(Math.abs(Number(transaction.amount || 0)))}`;
  return (
    <div className="activity-row">
      <div className={`activity-icon ${isCredit ? "credit" : "debit"}`}>{isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</div>
      <div className="activity-copy"><strong>{transaction.description}</strong><span>{formatDateTime(transaction.date)}</span></div>
      <strong className={isCredit ? "positive" : ""}>{signed}</strong>
      <ChevronRight className="activity-chevron" size={17} />
    </div>
  );
}
