import { ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";

type Tick = { symbol: string; price: string; change: number };

const TICKS: Tick[] = [
  { symbol: "BTC/USD", price: "112,480.20", change: 1.84 },
  { symbol: "ETH/USD", price: "4,128.65", change: 2.41 },
  { symbol: "SOL/USD", price: "236.14", change: -0.92 },
  { symbol: "AE INDEX", price: "1,842.09", change: 0.57 },
  { symbol: "XAU/USD", price: "3,412.80", change: 0.18 },
  { symbol: "USDC AUM", price: "48.2M", change: 3.06 },
];

function TickItem({ t }: { t: Tick }) {
  const up = t.change >= 0;
  return (
    <span className="flex shrink-0 items-center gap-2 px-5">
      <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground">
        {t.symbol}
      </span>
      <span className="font-mono text-xs text-foreground">{t.price}</span>
      <span
        className={`flex items-center gap-0.5 font-mono text-xs ${
          up ? "text-positive" : "text-negative"
        }`}
      >
        {up ? (
          <ArrowUpRight className="size-3.5" />
        ) : (
          <ArrowDownRight className="size-3.5" />
        )}
        {up ? "+" : ""}
        {t.change.toFixed(2)}%
      </span>
      <span className="pl-3 text-hairline">|</span>
    </span>
  );
}

export function MarketTicker() {
  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-40 mx-auto w-full max-w-6xl px-4 md:px-8">
      <div className="glass-bar flex items-stretch overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-elevated)]">
        <div className="flex shrink-0 items-center gap-2 border-r border-hairline bg-surface-2/60 px-4">
          <span className="animate-pulse-dot size-2 rounded-full bg-positive" />
          <span className="eyebrow hidden text-foreground sm:inline">
            Market&nbsp;live
          </span>
          <Radio className="size-4 text-positive sm:hidden" />
        </div>
        <div className="marquee-mask flex min-w-0 flex-1 items-center overflow-hidden py-2.5">
          <span className="animate-marquee flex shrink-0">
            {[0, 1].map((k) => (
              <span key={k} className="flex shrink-0">
                {TICKS.map((t) => (
                  <TickItem key={`${k}-${t.symbol}`} t={t} />
                ))}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
