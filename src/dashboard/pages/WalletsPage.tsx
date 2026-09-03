import { CheckCircle2, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { WALLET_PROOFS } from "../../lib/aetheris";

const walletRows = [
  ["BTC", "Bitcoin", "Bitcoin Network"],
  ["ETH", "Ethereum", "Ethereum Network"],
  ["USDT-TRC20", "USDT", "TRON Network"],
] as const;

export function WalletsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };
  return (
    <div className="dashboard-page">
      <header className="dashboard-page-heading"><div><div className="dashboard-eyebrow">Settlement</div><h1>Digital Asset Wallets</h1><p>Official settlement addresses and verification information.</p></div></header>
      <section className="dashboard-card wallets-card">
        <div className="wallets-intro"><ShieldCheck size={22} /><div><h2>Verified Settlement Wallets</h2><p>Use the published addresses for authorized settlement only. Verify the network before sending assets.</p></div></div>
        <div className="wallet-list">
          {walletRows.map(([key, name, network]) => { const proof = WALLET_PROOFS[key]; return <div className="wallet-row" key={key}><div className={`coin-icon coin-${key.toLowerCase().replace("-trc20", "")}`}>{key === "USDT-TRC20" ? "₮" : key[0]}</div><div className="wallet-name"><strong>{name}</strong><span>{network}</span></div><div className="wallet-address"><strong>{proof.address}</strong><span><CheckCircle2 size={14} /> Cryptographically signed</span></div><button type="button" className="wallet-copy" onClick={() => copy(key, proof.address)} aria-label={`Copy ${name} wallet address`}><Copy size={17} />{copied === key ? "Copied" : "Copy"}</button>{proof.verificationLink && <a className="wallet-external" href={proof.verificationLink} target="_blank" rel="noreferrer" aria-label={`Verify ${name} signature`}><ExternalLink size={17} /></a>}</div>; })}
        </div>
      </section>
    </div>
  );
}
