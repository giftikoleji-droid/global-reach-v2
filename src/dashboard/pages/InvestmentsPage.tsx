import { ArrowRight, Check, LockKeyhole, TrendingUp } from "lucide-react";
import { PLANS, formatUSD, type Investment } from "../../lib/aetheris";
import { useDashboard } from "../context/DashboardContext";

export function InvestmentsPage({
  activeInvestment,
  onChoosePlan,
  onBack,
}: {
  activeInvestment: Investment | null;
  // exactOptionalPropertyTypes-compatible
  onChoosePlan?: ((planId: string) => void) | undefined;
  onBack: () => void;
}) {
  const { navigate } = useDashboard();
  const activePlanId = activeInvestment?.plan_id;

  const handleChoosePlan = (planId: string) => {
    if (activeInvestment && activePlanId !== planId) return;
    onChoosePlan?.(planId);
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-page-heading">
        <div>
          <div className="dashboard-eyebrow">Investment Desk</div>
          <h1>Investment Mandates</h1>
          <p>
            Review the four Aetheris Capital mandates and select the allocation that fits your
            objectives.
          </p>
        </div>
      </header>

      {activeInvestment && (
        <div className="notice-card">
          <TrendingUp size={19} />
          <span>
            Your active mandate is <strong>{activeInvestment.plan_name}</strong>. A client account can
            maintain one active mandate at a time.
          </span>
        </div>
      )}

      <div className="plan-grid">
        {PLANS.map((plan) => {
          const isActive = activePlanId === plan.id;
          const blocked = Boolean(activeInvestment && !isActive);
          return (
            <article
              className={`mandate-card ${plan.featured ? "featured" : ""} ${isActive ? "is-active" : ""}`}
              key={plan.id}
            >
              <div className="mandate-card-top">
                <span className="plan-badge">{plan.badge}</span>
                {isActive && <span className="active-badge">ACTIVE</span>}
              </div>
              <h2>{plan.name}</h2>
              <div className="plan-range">
                {formatUSD(plan.minAmount)}
                {plan.maxAmount ? ` – ${formatUSD(plan.maxAmount)}` : "+"}
              </div>
              <div className="plan-return">
                <strong>+{plan.returnPct}%</strong>
                <span>fixed return · {plan.termDays} days</span>
              </div>
              <p className="plan-strategy">{plan.strategy}</p>
              <ul className="plan-details">
                {plan.details.map((detail) => (
                  <li key={detail}>
                    <Check size={14} /> {detail}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="dashboard-button"
                disabled={blocked || isActive || !onChoosePlan}
                aria-disabled={blocked || isActive || !onChoosePlan}
                onClick={() => handleChoosePlan(plan.id)}
              >
                {isActive ? (
                  <>
                    <LockKeyhole size={16} /> Active Mandate
                  </>
                ) : blocked ? (
                  "Unavailable"
                ) : (
                  <>
                    {plan.actionText} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>

      <div className="dashboard-page-actions">
        <button type="button" className="dashboard-button secondary" onClick={onBack}>
          Back to Overview
        </button>
        <button
          type="button"
          className="dashboard-button secondary"
          onClick={() => navigate("dashboard")}
        >
          Portfolio Home
        </button>
      </div>
    </div>
  );
}
