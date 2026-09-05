import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const COMPANY_WALLETS = {
  BTC: "bc1q3z6xhcwagwth320x6hh7g3e042gzud6uh0jcss",
  ETH: "0xA134C2FaB2D5c7A2373eF44E855fE9A30Ad8A020",
  "USDT-TRC20": "TB6GnfTGrfRLhpLwsj8W96jbKQfCqPca6x",
} as const;

const PLANS: Record<string, { name: string; amount: number; returnPct: number; termDays: number }> =
  {
    starter: { name: "Essential Plan", amount: 50, returnPct: 8, termDays: 30 },
    growth: { name: "Balanced Plan", amount: 500, returnPct: 12, termDays: 45 },
    pro: { name: "Advanced Plan", amount: 5000, returnPct: 16, termDays: 60 },
    elite: { name: "Premier Plan", amount: 25000, returnPct: 20, termDays: 90 },
  };

const MIN_CONFIRMATIONS = 3;
const USD_TOLERANCE = 0.03;

type BitcoinOutput = {
  scriptpubkey_address?: string;
  value?: number;
};

type TronTransfer = {
  transaction_id?: string;
  txID?: string;
  to?: string;
  value?: string | number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanHash(value: unknown) {
  return String(value || "").trim();
}
function isHexHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}
function isBtcHash(value: string) {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

async function getUsdPrices() {
  const url =
    Deno.env.get("PRICE_API_URL") ||
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd";
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("Price provider unavailable");
  const data = await response.json();
  return {
    BTC: Number(data.bitcoin?.usd),
    ETH: Number(data.ethereum?.usd),
    USDT: Number(data.tether?.usd || 1),
  };
}

async function verifyBitcoin(txHash: string, expectedUsd: number) {
  if (!isBtcHash(txHash)) return { ok: false, error: "Invalid Bitcoin transaction ID format." };
  const base = Deno.env.get("BTC_API_URL") || "https://blockstream.info/api";
  const txResponse = await fetch(`${base}/tx/${txHash}`);
  if (!txResponse.ok) return { ok: false, error: "Bitcoin transaction not found." };
  const tx = await txResponse.json();
  const height = Number(tx.status?.block_height);
  if (!tx.status?.confirmed || !Number.isInteger(height))
    return { ok: false, error: "Bitcoin transaction is not confirmed yet." };
  const tipResponse = await fetch(`${base}/blocks/tip/height`);
  if (!tipResponse.ok)
    return { ok: false, error: "Bitcoin confirmation status is temporarily unavailable." };
  const tip = Number(await tipResponse.text());
  const confirmations = tip - height + 1;
  if (confirmations < MIN_CONFIRMATIONS)
    return {
      ok: false,
      confirmations,
      error: `Bitcoin transaction has only ${confirmations} confirmation(s); ${MIN_CONFIRMATIONS} are required.`,
    };
  const prices = await getUsdPrices();
  const expectedBtc = expectedUsd / prices.BTC;
  const outputs = (tx.vout || []) as BitcoinOutput[];
  const receivedBtc = outputs
    .filter(
      (o) =>
        String(o.scriptpubkey_address || "").toLowerCase() === COMPANY_WALLETS.BTC.toLowerCase(),
    )
    .reduce((sum, o) => sum + Number(o.value || 0) / 1e8, 0);
  if (receivedBtc < expectedBtc * (1 - USD_TOLERANCE))
    return {
      ok: false,
      confirmations,
      error: "Bitcoin transaction amount or recipient does not match the selected plan.",
    };
  return { ok: true, confirmations, received: receivedBtc };
}

async function rpc(url: string, method: string, params: unknown[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error("Blockchain RPC unavailable");
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || "Blockchain RPC error");
  return body.result;
}

async function verifyEthereum(txHash: string, expectedUsd: number) {
  if (!isHexHash(txHash)) return { ok: false, error: "Invalid Ethereum transaction hash format." };
  const rpcUrl = Deno.env.get("ETH_RPC_URL") || "https://ethereum.publicnode.com";
  const tx = await rpc(rpcUrl, "eth_getTransactionByHash", [txHash]);
  if (!tx) return { ok: false, error: "Ethereum transaction not found." };
  const receipt = await rpc(rpcUrl, "eth_getTransactionReceipt", [txHash]);
  if (!receipt || receipt.status !== "0x1")
    return { ok: false, error: "Ethereum transaction has not successfully settled." };
  const latestHex = await rpc(rpcUrl, "eth_blockNumber", []);
  const latest = parseInt(latestHex, 16);
  const block = parseInt(receipt.blockNumber, 16);
  const confirmations = latest - block + 1;
  if (confirmations < MIN_CONFIRMATIONS)
    return {
      ok: false,
      confirmations,
      error: `Ethereum transaction has only ${confirmations} confirmation(s); ${MIN_CONFIRMATIONS} are required.`,
    };
  if (String(tx.to || "").toLowerCase() !== COMPANY_WALLETS.ETH.toLowerCase())
    return {
      ok: false,
      confirmations,
      error: "Ethereum recipient does not match the official settlement address.",
    };
  const prices = await getUsdPrices();
  const receivedEth = Number(BigInt(tx.value || "0x0")) / 1e18;
  const expectedEth = expectedUsd / prices.ETH;
  if (receivedEth < expectedEth * (1 - USD_TOLERANCE))
    return {
      ok: false,
      confirmations,
      error: "Ethereum transaction amount does not match the selected plan.",
    };
  return { ok: true, confirmations, received: receivedEth };
}

async function verifyUsdtTrc20(txHash: string, expectedUsd: number) {
  if (!/^[a-fA-F0-9]{64}$/.test(txHash))
    return { ok: false, error: "Invalid TRON transaction hash format." };
  const apiUrl = Deno.env.get("TRON_API_URL") || "https://api.trongrid.io";
  const apiKey = (Deno.env.get("TRONGRID_API_KEY") || "").trim();
  if (!apiKey) throw new Error("TRONGRID_API_KEY is not configured");
  const headers = { accept: "application/json", "TRON-PRO-API-KEY": apiKey };
  const txResponse = await fetch(`${apiUrl}/v1/transactions/${txHash}`, { headers });
  if (!txResponse.ok) return { ok: false, error: "TRON transaction not found." };
  const txBody = await txResponse.json();
  const tx = txBody.data?.[0];
  if (!tx || tx.ret?.[0]?.contractRet !== "SUCCESS")
    return { ok: false, error: "TRON transaction has not successfully settled." };
  const block = Number(tx.blockNumber);
  const latestResponse = await fetch(`${apiUrl}/wallet/getnowblock`, { headers });
  if (!latestResponse.ok)
    return { ok: false, error: "TRON confirmation status is temporarily unavailable." };
  const latestBody = await latestResponse.json();
  const latest = Number(latestBody.block_header?.raw_data?.number);
  const confirmations = latest - block + 1;
  if (!Number.isFinite(block) || !Number.isFinite(latest) || confirmations < MIN_CONFIRMATIONS)
    return {
      ok: false,
      confirmations: Math.max(0, confirmations || 0),
      error: `TRON transaction has insufficient confirmations; ${MIN_CONFIRMATIONS} are required.`,
    };
  const transferResponse = await fetch(
    `${apiUrl}/v1/accounts/${COMPANY_WALLETS["USDT-TRC20"]}/transactions/trc20?limit=200&only_to=true&contract_address=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`,
    { headers },
  );
  if (!transferResponse.ok)
    return {
      ok: false,
      confirmations,
      error: "USDT transfer details are temporarily unavailable.",
    };
  const transferBody = await transferResponse.json();
  const transfers = (transferBody.data || []) as TronTransfer[];
  const transfer = transfers.find(
    (item) =>
      String(item.transaction_id || item.txID || "").toLowerCase() === txHash.toLowerCase() &&
      String(item.to || "").toLowerCase() === COMPANY_WALLETS["USDT-TRC20"].toLowerCase(),
  );
  if (!transfer)
    return {
      ok: false,
      confirmations,
      error: "USDT recipient does not match the official settlement address.",
    };
  const received = Number(transfer.value || 0) / 1e6;
  if (received < expectedUsd * (1 - USD_TOLERANCE))
    return { ok: false, confirmations, error: "USDT amount does not match the selected plan." };
  return { ok: true, confirmations, received };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (authError || !user) return json({ error: "Authentication required." }, 401);

    const body = await req.json();
    const planId = String(body.planId || "");
    const network = String(body.network || "");
    const txHash = cleanHash(body.txHash);
    const payoutAddress = String(body.payoutAddress || "").trim();
    const plan = PLANS[planId];
    if (!plan || !(network in COMPANY_WALLETS) || !txHash || !payoutAddress)
      return json({ error: "Invalid investment verification request." }, 400);

    const { data: duplicate } = await supabaseAdmin
      .from("investments")
      .select("id")
      .ilike("tx_hash", txHash)
      .maybeSingle();
    if (duplicate) return json({ error: "This transaction ID has already been used." }, 409);

    let result;
    if (network === "BTC") result = await verifyBitcoin(txHash, plan.amount);
    else if (network === "ETH") result = await verifyEthereum(txHash, plan.amount);
    else result = await verifyUsdtTrc20(txHash, plan.amount);

    if (!result.ok) {
      console.warn("[verify-deposit] rejected transaction", {
        userId: user.id,
        planId,
        network,
        txHash,
        reason: result.error,
      });
      return json(
        {
          error: result.error || "Transaction verification failed.",
          confirmations: result.confirmations || 0,
        },
        400,
      );
    }

    const now = new Date();
    const investment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      plan_id: planId,
      plan_name: plan.name,
      amount: plan.amount,
      return_pct: plan.returnPct,
      days: plan.termDays,
      term_days: plan.termDays,
      payout_address: payoutAddress,
      wallet_address: payoutAddress,
      network,
      tx_hash: txHash,
      status: "active",
      created_at: now.toISOString(),
      activated_at: now.toISOString(),
      start_date: now.toISOString(),
      maturity_date: new Date(now.getTime() + plan.termDays * 86400000).toISOString(),
      tx_verification_status: "verified",
      tx_verified_at: now.toISOString(),
      tx_confirmations: result.confirmations,
      tx_verification_error: null,
      current_value: plan.amount,
      note: String(body.note || "").trim() || null,
    };

    const { data, error } = await supabaseAdmin
      .from("investments")
      .insert(investment)
      .select("id, plan_id, plan_name, amount, status, start_date, maturity_date, tx_confirmations")
      .single();
    if (error) {
      if (error.code === "23505")
        return json({ error: "This transaction ID has already been used." }, 409);
      throw error;
    }
    console.log("[verify-deposit] investment activated", {
      userId: user.id,
      investmentId: data.id,
      network,
      confirmations: result.confirmations,
    });
    return json({ success: true, investment: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[verify-deposit] verification error", { message });
    return json(
      {
        error: "Transaction verification is temporarily unavailable. No investment was activated.",
      },
      503,
    );
  }
});
