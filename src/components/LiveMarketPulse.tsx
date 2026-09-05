import { ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import { formatUSD } from "../lib/aetheris";
import type { MarketRow } from "../lib/market";

export function LiveMarketPulse({ markets }: { markets: MarketRow[] }) {
  const tracked = ["BTC", "ETH", "USDT"].map((symbol) => markets.find((item) => item.symbol === symbol)).filter(Boolean) as MarketRow[];
  return (
    <section className="live-pulse-section" aria-label="Live market tracking">
      <div className="live-pulse-heading"><div><div className="section-label">Live Market Tracking</div><h2 className="section-title">Digital Asset Market Pulse</h2></div><span className="live-pulse-status"><i /> Live</span></div>
      <div className="live-pulse-grid">
        {tracked.map((market) => { const up = market.change >= 0; return <article className="live-pulse-card" key={market.id}><div className="live-pulse-symbol"><span>{market.symbol.slice(0,1)}</span><div><strong>{market.symbol}</strong><small>{market.name}</small></div></div><div className="live-pulse-price">{formatUSD(market.price)}</div><div className={`live-pulse-change ${up ? "up" : "down"}`}>{up ? <ArrowUpRight size={15}/> : <ArrowDownRight size={15}/>}<span>{up ? "+" : ""}{market.change.toFixed(2)}%</span><small>24H</small></div></article>; })}
        {!tracked.length && <div className="live-pulse-empty"><Activity size={17}/> Live market data is temporarily unavailable.</div>}
      </div>
      <p className="live-pulse-note">Market prices and 24H movements are external market data, not investment performance.</p>
    </section>
  );
}
