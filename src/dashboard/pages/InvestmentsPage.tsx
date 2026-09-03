import { ArrowRight, Check, LockKeyhole, TrendingUp } from "lucide-react";
import { PLANS, formatUSD, type Investment } from "../../lib/aetheris";
import { useDashboard } from "../context/DashboardContext";

export function InvestmentsPage({ activeInvestment, onChoosePlan, onBack }: { activeInvestment: Investment | null; onChoosePlan?: (planId: string) => void; onBack: () => void }) {
  const { navigate } = useDashboard();
  const activePlanId = activeInvestment?.plan_id;

  const handleChoosePlan = (planId: string) => {
    // Keep plan selection owned by the application shell so the existing
    // authentication and PlanModal flow remains unchanged.
    if (activeInvestment && activePlanId !== planId) return;
    onChoosePlan?.(planId);
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-heading">
        <div>
          <div className="dashboard-eyebrow">Investment Desk</div>
          <h1>Investment Mandates</h1>
          <p>Review the four Aetheris Capital mandates and select the allocation that fits your objectives.</p>
        </div>
      </header>

      {activeInvestment && (
        <div className="notice-card"><TrendingUp size={19} /><span>Your active mandate is <strong>{activeInvestment.plan_name}</strong>. A client account can maintain one active mandate at a time.</span></div>
      )}

      <div className="plan-grid">
        {PLANS.map((plan) => {
          const isActive = activePlanId === plan.id;
          const blocked = Boolean(activeInvestment && !isActive);
          return (
            <article className={`mandate-card ${plan.featured ? "featured" : ""} ${isActive ? "is-active" : ""}`} key={plan.id}>
              <div className="mandate-card-top"><span className="plan-badge">{plan.badge}</span>{isActive && <span className="active-badge">ACTIVE</span>}</div>
              <h2>{plan.name}</h2>
              <div className="plan-range">{formatUSD(plan.minAmount)}{plan.maxAmount ? ` – ${formatUSD(plan.maxAmount)}` : "+"}</div>
              <div className="plan-return"><strong>+{plan.returnPct}%</strong><span>fixed return · {plan.termDays} days</span></div>
              <p className="plan-strategy">{plan.strategy}</p>
              <ul>{plan.details.map((detail) => <li key={detail}><Check size={15} />{detail}</li>)}</ul>
              <button
                type="button"
                className={`dashboard-button ${isActive ? "secondary" : "primary"}`}
                disabled={blocked || isActive || !onChoosePlan}
                aria-disabled={blocked || isActive || !onChoosePlan}
                onClick={() => handleChoosePlan(plan.id)}
              >
                {isActive ? "Active Mandate" : blocked ? <><LockKeyhole size={15} /> One Active Mandate</> : <>Choose {plan.name} <ArrowRight size={16} /></>}
              </button>
            </article>
          );
        })}
      </div>
      <button type="button" className="text-action back-action" onClick={() => { onBack(); navigate("dashboard"); }}>Back to Dashboard</button>
    </div>
  );
}
