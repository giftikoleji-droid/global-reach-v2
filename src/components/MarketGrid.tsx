import { useState } from "react";
import { formatEur, LOCALE } from "../lib/aetheris";
import type { MarketRow } from "../lib/market";

export function MarketGrid({
  markets,
  expanded: controlledExpanded,
  onToggle: controlledOnToggle,
}: {
  markets: MarketRow[];
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const visible = isExpanded ? markets : markets.slice(0, 3);

  return (
    <div className={`markets-container ${isExpanded ? "markets-expanded" : ""}`}>
      <div className="market-grid">
        {visible.map((m) => {
          const up = m.change >= 0;
          return (
            <div className="market-card" key={m.id}>
              <div className="coin">
                <div className="coin-icon">{m.symbol.slice(0, 1)}</div>
                <div>
                  <div className="coin-name">{m.name}</div>
                  <div className="coin-symbol">{m.symbol}</div>
                </div>
              </div>
              <div className="market-price">
                ${m.price.toLocaleString(LOCALE, { maximumFractionDigits: m.price < 10 ? 4 : 2 })}
                <span style={{ display: "block", color: "var(--muted)", fontSize: ".68rem", fontWeight: 500, marginTop: "2px" }}>
                  {formatEur(m.priceEur, m.priceEur < 10 ? 4 : 2)}
                </span>
              </div>
              <div className={"market-change " + (up ? "up" : "down")}>
                {up ? "+" : ""}
                {m.change.toFixed(2)}% (24h)
              </div>
            </div>
          );
        })}
      </div>
      {markets.length > 3 && (
        <div className="see-more-wrap">
          <button type="button" className="see-more-btn" onClick={handleToggle}>
            {isExpanded ? "Show fewer markets" : "Show more markets"}
          </button>
        </div>
      )}
    </div>
  );
}
