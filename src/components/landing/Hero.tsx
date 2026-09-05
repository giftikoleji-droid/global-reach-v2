import { ArrowRight, Check, ShieldCheck } from "lucide-react";

const POINTS = [
  "Defined investment terms",
  "Segregated qualified custody",
  "Transparent portfolio positioning",
];

const STATS = [
  { value: "$48.2M", label: "Assets under mandate" },
  { value: "11 yrs", label: "Desk track record" },
  { value: "24/7", label: "Risk monitoring" },
];

export function Hero() {
  return (
    <section id="top" className="shell-gradient relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-gold">
              <ShieldCheck className="size-3.5" />
              Structured digital-asset management
            </span>

            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-bold leading-[1.03] md:text-6xl">
              Digital asset management,{" "}
              <span className="gold-gradient-text">built for the long term</span>
            </h1>

            <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-muted-foreground">
              Aetheris Capital provides structured digital-asset investment mandates with defined
              terms, transparent positioning and professional custody infrastructure. Start from $50
              — or deploy institutional-size capital.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#account"
                className="gold-fill inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform duration-200 hover:scale-[1.02]"
              >
                Create your free account <ArrowRight className="size-4" />
              </a>
              <a
                href="#mandates"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface/60 px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Explore investment plans
              </a>
            </div>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-3">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-surface/70 p-6 shadow-[var(--shadow-elevated)] md:p-8">
            <p className="eyebrow text-muted-foreground">Desk snapshot</p>
            <div className="mt-5 grid gap-5">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between border-b border-hairline pb-4 last:border-0 last:pb-0"
                >
                  <span className="font-display text-2xl font-semibold text-foreground md:text-3xl">
                    {s.value}
                  </span>
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Figures are indicative of desk activity and are updated daily. Capital at risk; past
              performance is not indicative of future results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
