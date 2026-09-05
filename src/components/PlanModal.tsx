import { useEffect, useState, type FormEvent } from "react";
import {
  COMPANY,
  formatCurrency,
  PLANS,
  WALLETS,
  WALLET_PROOFS,
  type Plan,
  type Profile,
  type WalletNetwork,
} from "../lib/aetheris";
import { supabase } from "../lib/supabase";

type Msg = { text: string; type: "error" | "success" | "info" } | null;

export function PlanModal({
  planId,
  user,
  onClose,
  onCreated,
  onRequireAuth,
}: {
  planId: string | null;
  user: Profile | null;
  onClose: () => void;
  onCreated: () => void;
  onRequireAuth: () => void;
}) {
  const plan: Plan | undefined = PLANS.find((p) => p.id === planId);
  const [msg, setMsg] = useState<Msg>(null);
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMsg(null);
    setNetwork("");
    setAddress("");
    setNote("");
    setTxHash("");
    setShowDeposit(false);
  }, [planId]);

  if (!planId || !plan) return null;

  const resolvedWallet: string | undefined =
    network && network in WALLETS ? WALLETS[network as WalletNetwork] : undefined;
  const depositAddress: string = resolvedWallet ?? "Select network above";

  function continueToDeposit(e: FormEvent): void {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!network) {
      setMsg({ text: "Please select a payout network.", type: "error" });
      return;
    }
    if (!address.trim()) {
      setMsg({ text: "Please enter your payout wallet address.", type: "error" });
      return;
    }
    setMsg(null);
    setShowDeposit(true);
  }

  async function confirmDeposit(): Promise<void> {
    if (!plan) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    if (txHash.trim().length < 8) {
      setMsg({ text: "Please enter a valid Transaction Hash / ID.", type: "error" });
      return;
    }

    setBusy(true);
    setMsg({ text: "Verifying transaction on the selected blockchain…", type: "info" });

    try {
      const { data, error } = await supabase.functions.invoke("verify-deposit", {
        body: {
          planId: plan.id,
          network,
          payoutAddress: address.trim(),
          txHash: txHash.trim(),
          note: note.trim() || null,
        },
      });

      const result = data as { success?: boolean; error?: string } | null | undefined;
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || "Transaction could not be verified.");
      }

      setBusy(false);
      setMsg({ text: "Transaction verified and mandate activated successfully.", type: "success" });
      setTimeout(() => {
        onCreated();
        onClose();
      }, 700);
    } catch (error) {
      console.error("[PlanModal] transaction verification failed", error);
      setBusy(false);
      setMsg({
        text:
          error instanceof Error
            ? error.message
            : "Transaction verification failed. No investment was activated.",
        type: "error",
      });
    }
  }

  return (
    <div
      className={"modal open"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="plan-box" style={{ position: "relative", zIndex: 10000, pointerEvents: "auto" }}>
        <button className="close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2>Activate Investment Mandate</h2>
        <p className="auth-sub">
          Register your settlement wallet, transmit allocation to company escrow, and confirm tracking.
        </p>

        {msg && <div className={"message show " + msg.type}>{msg.text}</div>}

        <div className="selected-plan-summary">
          <strong>{plan.name} Mandate</strong> · {formatCurrency(plan.amount)} allocation · +
          {plan.returnPct}% target yield · {plan.termDays} days
        </div>

        {!showDeposit ? (
          <form onSubmit={continueToDeposit}>
            <div className="form-group">
              <label htmlFor="payout-network">Settlement Network (Where returns will be paid)</label>
              <select
                id="payout-network"
                required
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="">Select network</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH / ERC-20)</option>
                <option value="USDT-TRC20">Tether (USDT TRC-20)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="payout-address">Your Receiving Wallet Address</label>
              <input
                id="payout-address"
                type="text"
                required
                placeholder="Paste destination wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="plan-note">Client Reference / Note (Optional)</label>
              <textarea
                id="plan-note"
                placeholder="e.g. Allocation ref Q3-GLOBAL-01"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button className="primary-btn submit" type="submit">
              Proceed to Deposit Address
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 8, color: "var(--cyan)" }}>
              Step 1: Transmit {formatCurrency(plan.amount)} to Company Escrow Wallet
            </div>

            <div className="wallet-address" style={{ margin: "6px 0" }}>
              {depositAddress}
            </div>

            <button
              type="button"
              className="copy-btn"
              style={{ marginTop: 4, marginBottom: 14 }}
              onClick={() => {
                navigator.clipboard.writeText(depositAddress).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Address Copied!" : "Copy Deposit Address"}
            </button>

            {(() => {
              const proofKey = network as WalletNetwork;
              const depositProof: (typeof WALLET_PROOFS)[WalletNetwork] | undefined =
                network && proofKey in WALLET_PROOFS ? WALLET_PROOFS[proofKey] : undefined;
              if (!depositProof) return null;
              return (
                <div
                  style={{
                    marginBottom: 14,
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ fontSize: ".82rem", color: "var(--muted)", fontWeight: 600 }}>
                    Cryptographic Proof of Ownership
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--cyan)" }}>
                      Signed Message
                    </div>
                    <div className="wallet-address" style={{ marginTop: 4, fontSize: ".75rem" }}>
                      {depositProof.signedMessage}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--cyan)" }}>
                      Signature
                    </div>
                    <div className="wallet-address" style={{ marginTop: 4, fontSize: ".72rem" }}>
                      {depositProof.signature}
                    </div>
                  </div>
                  {"verificationLink" in depositProof && depositProof.verificationLink && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={depositProof.verificationLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--cyan)", fontSize: ".8rem", textDecoration: "underline" }}
                      >
                        Verify Signature on Etherscan ↗
                      </a>
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--muted)" }}>
                    Verify company wallet ownership on-chain using the cryptographic signature above.
                  </div>
                </div>
              );
            })()}

            <div className="form-group" style={{ marginTop: 12 }}>
              <label htmlFor="tx-hash">Step 2: Transaction ID / Hash</label>
              <input
                id="tx-hash"
                type="text"
                required
                placeholder="Paste TX hash from your wallet / exchange"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="primary-btn submit"
              onClick={() => void confirmDeposit()}
              disabled={busy || !txHash.trim()}
            >
              {busy ? "Verifying On-Chain…" : "Verify Deposit & Begin Tracking"}
            </button>

            <p style={{ color: "var(--muted)", fontSize: ".72rem", marginTop: 14, lineHeight: 1.5 }}>
              Settlement desk operates under global standard market hours. Payout executes automatically
              at term maturity. Support:{" "}
              <a href={`mailto:${COMPANY.email}`} style={{ color: "var(--cyan)" }}>
                {COMPANY.email}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}