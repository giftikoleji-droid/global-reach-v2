// Shared institutional constants, types and database layer for Aetheris Capital.

export const LOCALE = "en-IE";
export const REGION = "IE";

export const COMPANY = {
  name: "Aetheris Capital",
  legalName: "Aetheris Capital Ltd.",
  tagline: "Institutional Digital-Asset Yield · Global Desk",
  email: "aetheriscapital.support@gmail.com",
  adminEmails: ["giftese911@gmail.com", "aetheriscapital.support@gmail.com"],
  address: {
    line1: "Riverside One, Sir John Rogerson's Quay",
    line2: "International Financial Services Centre (IFSC)",
    city: "Dublin 2",
    postalCode: "D02 X576",
    country: "Ireland",
  },
  phone: "+353 1 566 4300",
  hours: "Mon–Fri, 09:00–18:00 UTC (Global Market Hours)",
} as const;

export const ADDRESS_LINES = [
  COMPANY.legalName,
  COMPANY.address.line1,
  COMPANY.address.line2,
  `${COMPANY.address.city}, ${COMPANY.address.postalCode}`,
  COMPANY.address.country,
];

export type Plan = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  amount: number;
  returnPct: number;
  termDays: number;
  strategy: string;
  badge: string;
  featured: boolean;
  details: string[];
  apy: string;
  actionText: string;
};

// The 4 REAL company investment plans (Strictly Starter, Growth, Pro, Elite)
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Essential Plan",
minAmount: 100,
    maxAmount: 499,
    amount: 100,
    returnPct: 8,
    termDays: 30,
    strategy: "Lending + Staking Arbitrage",
    badge: "Great First Step",
    featured: false,
    details: [
      "Invest $100 – $499",
      "8% fixed return in 30 days",
      "Principal & yield credited at maturity",
      "Lowest-risk systematic liquidity mix",
    ],
    apy: "8% in 30d",
    actionText: "Select Essential Plan",
  },
  {
    id: "growth",
    name: "Balanced Plan",
    minAmount: 500,
    maxAmount: 4999,
    amount: 500,
    returnPct: 12,
    termDays: 45,
    strategy: "Funding Rate Income + Institutional Lending",
    badge: "Most Popular",
    featured: true,
    details: [
      "Invest $500 – $4,999",
      "12% fixed return in 45 days",
      "Principal & yield credited at maturity",
      "Balanced systematic strategy mix",
    ],
    apy: "12% in 45d",
    actionText: "Select Balanced Plan",
  },
  {
    id: "pro",
    name: "Advanced Plan",
    minAmount: 5000,
    maxAmount: 24999,
    amount: 5000,
    returnPct: 16,
    termDays: 60,
    strategy: "Cross-Venue Liquidity + Delta-Neutral Arbitrage",
    badge: "For Serious Investors",
    featured: false,
    details: [
      "Invest $5,000 – $24,999",
      "16% fixed return in 60 days",
      "Principal & yield credited at maturity",
      "Dedicated institutional liquidity desk",
    ],
    apy: "16% in 60d",
    actionText: "Select Advanced Plan",
  },
  {
    id: "elite",
    name: "Premier Plan",
    minAmount: 25000,
    maxAmount: null,
    amount: 25000,
    returnPct: 20,
    termDays: 90,
    strategy: "Full Systematic Strategy Mix + Bespoke Escrow",
    badge: "Institutional",
    featured: false,
    details: [
      "Invest $25,000 and above",
      "20% fixed return in 90 days",
      "Principal & yield credited at maturity",
      "VIP custody & high-volume arbitrage allocation",
    ],
    apy: "20% in 90d",
    actionText: "Select Premier Plan",
  },
];

// Deposit settlement addresses with verified signatures
export const WALLET_PROOFS: Record<
  string,
  { address: string; signature: string; signedMessage: string; verificationLink?: string }
> = {
  BTC: {
    address: "bc1q3z6xhcwagwth320x6hh7g3e042gzud6uh0jcss",
    signature:
      "J3wmRyedzmLJf+iMNKdGjJ5618bf5FN4u8HbVUfMPFUMM2h5XCu6DcTah5w501mAvado9tVMWd/RNXdX+Uyxiw4=",
    signedMessage: "Aetheris Capital Ltd – Official BTC deposit wallet – 2026",
  },
  ETH: {
    address: "0xA134C2FaB2D5c7A2373eF44E855fE9A30Ad8A020",
    signature:
      "0x4d04f4f8b8a22ff60012d6bee3bff82a0dbc21ba8bc3ca46b04070f5a72ad9747fb86dc0840f4e7557c43ab2591bab953520574f8b3f7c895644f788b5a975fe1c",
    signedMessage: "Aetheris Capital Ltd – Official ETH deposit wallet – 2026",
    verificationLink: "https://etherscan.io/verifySig/336078",
  },
  "USDT-TRC20": {
    address: "TB6GnfTGrfRLhpLwsj8W96jbKQfCqPca6x",
    signature:
      "0xba9d356ed1e3b6989c904e4c52710d7543b78bb070908c793d097bb2d9060dd90154b3f3219026b96d0904e317618359c0ba39abb9b574e5ee0dedf3b335becc1b",
    signedMessage: "Aetheris Capital Ltd – Official USDT TRC-20 deposit wallet – 2026",
  },
};

export const WALLETS: Record<string, string> = Object.fromEntries(
  Object.entries(WALLET_PROOFS).map(([k, v]) => [k, v.address])
) as Record<string, string>;

export function formatCurrency(n: number | string, decimals: number = 0): string {
  const val = Number(n || 0);
  return "$" + val.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatUSD(n: number | string | undefined | null, decimals: number = 2): string {
  const val = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatEur(n: number, digits = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatDate(value: string | number | Date): string {
  try {
    return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatDateTime(value: string | number | Date): string {
  try {
    const d = new Date(value);
    return (
      new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(d)
    );
  } catch {
    return String(value);
  }
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "Pending Confirmation",
    active: "Active",
    matured: "Matured (Paid Out)",
    completed: "Matured (Paid Out)",
  };
  return map[s] ?? s;
}

export function statusBadgeClass(s: string): string {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    active: "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40",
    matured: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  };
  return map[s] ?? "bg-slate-500/15 text-slate-300 border border-slate-500/30";
}

export function generateRefCode(email: string): string {
  const prefix = (email.split("@")[0] ?? "AETH").slice(0, 4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + rand;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "client" | "admin";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ref_code: string | null;
  referred_by?: string | null;
  bonus_earned: number;
};

export type Balance = {
  user_id: string;
  available_balance: number;
  updated_at?: string;
};

export type Investment = {
  id: string;
  user_id: string;
  user_email?: string;
  plan_name: "Starter" | "Growth" | "Pro" | "Elite" | string;
  plan_id: string;
  amount_invested: number;
  amount: number; // Backward-compat alias
  current_value: number;
  return_pct: number;
  expected_return: number;
  term_days: number;
  payout_network?: string;
  payout_address?: string;
  wallet_address?: string;
  note?: string | null;
  tx_id?: string;
  tx_hash?: string;
  status: "pending" | "active" | "matured" | "completed";
  start_date: string;
  end_date: string;
  maturity_date?: string;
  confirmed_at?: string;
  created_at?: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  user_email?: string;
  amount: number;
  type: "investment" | "payout" | "withdrawal";
  description: string;
  date: string;
  created_at?: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: string;
  commission_earned: number;
  created_at: string;
};

export type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  investor_type: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  ticket_id: string;
  user_email: string | null;
  transcript: Array<{ role: string; content: string }>;
  status: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE ADAPTER (Offline & Preview Fallback Layer)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

const STORAGE_KEYS = {
  USER: "aetheris_current_user",
  PROFILES: "aetheris_profiles",
  BALANCES: "aetheris_balances",
  INVESTMENTS: "aetheris_investments",
  TRANSACTIONS: "aetheris_transactions",
  LEADS: "aetheris_leads",
  TICKETS: "aetheris_tickets",
  REFERRALS: "aetheris_referrals",
};

export const localStore = {
  getUser(): Profile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const adminList = COMPANY.adminEmails as readonly string[];
      return {
        ...parsed,
        role: parsed.role || (parsed.email && adminList.includes(parsed.email.toLowerCase()) ? "admin" : "client"),
      };
    } catch {
      return null;
    }
  },

  setUser(user: Profile | null) {
    try {
      if (!user) {
        localStorage.removeItem(STORAGE_KEYS.USER);
      } else {
        const adminList = COMPANY.adminEmails as readonly string[];
        const enriched: Profile = {
          ...user,
          role: user.role || (user.email && adminList.includes(user.email.toLowerCase()) ? "admin" : "client"),
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(enriched));
      }
    } catch {
      // Storage unavailable
    }
  },

  getBalance(userId: string): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BALANCES);
      const map = raw ? JSON.parse(raw) : {};
      return Number(map[userId] ?? 0.0);
    } catch {
      return 0.0;
    }
  },

  setBalance(userId: string, amount: number): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BALANCES);
      const map = raw ? JSON.parse(raw) : {};
      map[userId] = Math.max(0, Number(amount));
      localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(map));
    } catch {
      // ignore
    }
  },

  getInvestments(userId?: string): Investment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      const list: Investment[] = raw ? JSON.parse(raw) : [];
      if (userId) {
        return list.filter((i) => i.user_id === userId);
      }
      return list;
    } catch {
      return [];
    }
  },

  saveInvestments(list: Investment[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  addInvestment(inv: Omit<Investment, "id"> & { id?: string }): Investment {
    const list = this.getInvestments();
    const item: Investment = {
      id: inv.id || "inv_" + Math.random().toString(36).substring(2, 10),
      ...inv,
      amount: Number(inv.amount_invested ?? inv.amount ?? 0),
      amount_invested: Number(inv.amount_invested ?? inv.amount ?? 0),
      current_value: Number(inv.current_value ?? inv.amount_invested ?? inv.amount ?? 0),
      status: (inv.status as "pending" | "active" | "matured" | "completed") || "active",
      start_date: inv.start_date || new Date().toISOString(),
      end_date: inv.end_date || inv.maturity_date || new Date(Date.now() + (inv.term_days || 30) * 86400000).toISOString(),
    };
    list.unshift(item);
    this.saveInvestments(list);
    return item;
  },

  updateInvestment(id: string, updates: Partial<Investment>): Investment | null {
    const list = this.getInvestments();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    this.saveInvestments(list);
    return list[idx];
  },

  getTransactions(userId?: string): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const list: Transaction[] = raw ? JSON.parse(raw) : [];
      if (userId) {
        return list.filter((t) => t.user_id === userId);
      }
      return list;
    } catch {
      return [];
    }
  },

  saveTransactions(list: Transaction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  addTransaction(tx: Omit<Transaction, "id" | "date"> & { id?: string; date?: string }): Transaction {
    const list = this.getTransactions();
    const item: Transaction = {
      id: tx.id || "tx_" + Math.random().toString(36).substring(2, 10),
      ...tx,
      amount: Number(tx.amount || 0),
      date: tx.date || new Date().toISOString(),
    };
    list.unshift(item);
    this.saveTransactions(list);
    return item;
  },

  addLead(lead: Omit<Lead, "id" | "created_at">): Lead {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
      const list: Lead[] = raw ? JSON.parse(raw) : [];
      const item: Lead = {
        id: "lead_" + Math.random().toString(36).substring(2, 10),
        ...lead,
        created_at: new Date().toISOString(),
      };
      list.unshift(item);
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(list));
      return item;
    } catch {
      return {
        id: "lead_err",
        ...lead,
        created_at: new Date().toISOString(),
      };
    }
  },

  addTicket(ticket: Omit<SupportTicket, "id" | "created_at">): SupportTicket {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
      const list: SupportTicket[] = raw ? JSON.parse(raw) : [];
      const item: SupportTicket = {
        id: "tick_" + Math.random().toString(36).substring(2, 10),
        ...ticket,
        created_at: new Date().toISOString(),
      };
      list.unshift(item);
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(list));
      return item;
    } catch {
      return {
        id: "tick_err",
        ...ticket,
        created_at: new Date().toISOString(),
      };
    }
  },

  recordReferral(refCode: string, referredUserId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFERRALS);
      const list: Referral[] = raw ? JSON.parse(raw) : [];
      list.push({
        id: "ref_" + Math.random().toString(36).substring(2, 10),
        referrer_id: refCode,
        referred_user_id: referredUserId,
        status: "active",
        commission_earned: 0,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(list));
    } catch {
      // Storage unavailable
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED DATABASE & ADMIN PAYOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export const db = {
  // Check if a user/profile has admin rights
  isAdmin(userOrProfile: { email?: string; role?: string } | null): boolean {
    if (!userOrProfile) return false;
    if (userOrProfile.role === "admin") return true;
    const adminList = COMPANY.adminEmails as readonly string[];
    if (userOrProfile.email && adminList.includes(userOrProfile.email.toLowerCase())) {
      return true;
    }
    return false;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        const adminList = COMPANY.adminEmails as readonly string[];
        const isAdminUser =
          data.role === "admin" ||
          (data.email && adminList.includes(data.email.toLowerCase()));
        return {
          id: data.id,
          name: data.name || data.full_name || "Institutional Client",
          email: data.email,
          role: isAdminUser ? "admin" : (data.role || "client"),
          ref_code: data.ref_code,
          bonus_earned: Number(data.bonus_earned || 0),
        };
      }
    } catch {
      // fallback to local
    }
    return localStore.getUser();
  },

  async saveProfile(profile: Profile): Promise<Profile> {
    localStore.setUser(profile);
    try {
      await supabase.from("profiles").upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        ref_code: profile.ref_code,
        bonus_earned: profile.bonus_earned,
      });
    } catch {
      // continue
    }
    return profile;
  },

  // ─── User Available Balance ───
  async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("balances")
        .select("available_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        const bal = Number(data.available_balance || 0);
        localStore.setBalance(userId, bal);
        return bal;
      }
    } catch {
      // continue
    }
    return localStore.getBalance(userId);
  },

  async updateBalance(userId: string, newBalance: number): Promise<number> {
    const val = Math.max(0, Number(newBalance || 0));
    localStore.setBalance(userId, val);

    try {
      await supabase
        .from("balances")
        .upsert({
          user_id: userId,
          available_balance: val,
          updated_at: new Date().toISOString(),
        });
    } catch {
      // continue
    }
    return val;
  },

  // ─── Investments ───
  async getInvestments(userId: string): Promise<Investment[]> {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const parsed: Investment[] = data.map((d) => {
          const plan = PLANS.find((p) => p.id === d.plan_id || p.name.toLowerCase() === (d.plan_name || "").toLowerCase()) || PLANS[0];
          const amt = Number(d.amount_invested ?? d.amount ?? 0);
          const retPct = Number(d.return_pct ?? plan.returnPct);
          const currVal = Number(d.current_value ?? amt * (1 + retPct / 100));

          return {
            id: d.id,
            user_id: d.user_id,
            user_email: d.user_email,
            plan_id: d.plan_id || plan.id,
            plan_name: d.plan_name || plan.name,
            amount_invested: amt,
            amount: amt,
            current_value: currVal,
            return_pct: retPct,
            expected_return: amt * (1 + retPct / 100),
            term_days: d.term_days || plan.termDays,
            payout_network: d.wallet_address?.startsWith("0x") ? "ETH" : (d.wallet_address?.startsWith("bc1") ? "BTC" : "USDT-TRC20"),
            payout_address: d.wallet_address || "",
            wallet_address: d.wallet_address || "",
            tx_id: d.tx_hash || "",
            tx_hash: d.tx_hash || "",
            status: d.status || "active",
            start_date: d.start_date || d.created_at || new Date().toISOString(),
            end_date: d.end_date || d.maturity_date || new Date(Date.now() + (d.term_days || plan.termDays) * 86400000).toISOString(),
            maturity_date: d.end_date || d.maturity_date,
            created_at: d.created_at,
          };
        });
        localStore.saveInvestments(parsed);
        return parsed;
      }
    } catch {
      // fallback
    }
    return localStore.getInvestments(userId);
  },

  async getAllInvestments(): Promise<Investment[]> {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*, profiles(email, name)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const plan = PLANS.find((p) => p.id === d.plan_id || p.name.toLowerCase() === (d.plan_name || "").toLowerCase()) || PLANS[0];
          const amt = Number(d.amount_invested ?? d.amount ?? 0);
          const retPct = Number(d.return_pct ?? plan.returnPct);
          const currVal = Number(d.current_value ?? amt * (1 + retPct / 100));

          return {
            id: d.id,
            user_id: d.user_id,
            user_email: d.profiles?.email || d.user_email || "Client",
            plan_id: d.plan_id || plan.id,
            plan_name: d.plan_name || plan.name,
            amount_invested: amt,
            amount: amt,
            current_value: currVal,
            return_pct: retPct,
            expected_return: amt * (1 + retPct / 100),
            term_days: d.term_days || plan.termDays,
            wallet_address: d.wallet_address || "",
            payout_address: d.wallet_address || "",
            tx_hash: d.tx_hash || "",
            tx_id: d.tx_hash || "",
            status: d.status || "active",
            start_date: d.start_date || d.created_at || new Date().toISOString(),
            end_date: d.end_date || d.maturity_date || new Date(Date.now() + (d.term_days || plan.termDays) * 86400000).toISOString(),
            maturity_date: d.end_date || d.maturity_date,
            created_at: d.created_at,
          };
        });
      }
    } catch {
      // fallback
    }
    return localStore.getInvestments();
  },

  async addInvestment(inv: {
    user_id: string;
    plan_id: string;
    plan_name?: string;
    amount?: number;
    amount_invested?: number;
    current_value?: number;
    return_pct: number;
    expected_return?: number;
    term_days: number;
    start_date?: string;
    end_date?: string;
    maturity_date?: string;
    status?: "pending" | "active" | "matured";
    tx_hash?: string;
    wallet_address?: string;
  }): Promise<Investment> {
    const plan = PLANS.find((p) => p.id === inv.plan_id || p.name.toLowerCase() === (inv.plan_name || "").toLowerCase()) || PLANS[0];
    const planName = inv.plan_name || plan.name;
    const startDate = inv.start_date || new Date().toISOString();
    const endDate = inv.end_date || inv.maturity_date || new Date(Date.now() + inv.term_days * 86400000).toISOString();
    const amt = Number(inv.amount_invested ?? inv.amount ?? 0);
    const retPct = Number(inv.return_pct || plan.returnPct);
    const currVal = Number(inv.current_value ?? (amt * (1 + retPct / 100)));

    const local = localStore.addInvestment({
      user_id: inv.user_id,
      plan_id: plan.id,
      plan_name: planName,
      amount: amt,
      amount_invested: amt,
      current_value: currVal,
      return_pct: retPct,
      expected_return: currVal,
      term_days: inv.term_days,
      payout_network: inv.wallet_address?.startsWith("0x") ? "ETH" : "USDT-TRC20",
      payout_address: inv.wallet_address || "",
      wallet_address: inv.wallet_address || "",
      tx_id: inv.tx_hash || "",
      tx_hash: inv.tx_hash || "",
      status: inv.status || "active",
      start_date: startDate,
      end_date: endDate,
      maturity_date: endDate,
    });

    // Also record transaction for the investment
    localStore.addTransaction({
      user_id: inv.user_id,
      amount: amt,
      type: "investment",
      description: `${planName} Mandate Capital Allocation`,
      date: startDate,
    });

    try {
      const { data, error } = await supabase
        .from("investments")
        .insert({
          user_id: inv.user_id,
          plan_name: planName,
          plan_id: plan.id,
          amount_invested: amt,
          amount: amt,
          current_value: currVal,
          return_pct: retPct,
          term_days: inv.term_days,
          start_date: startDate,
          end_date: endDate,
          maturity_date: endDate,
          status: inv.status || "active",
          tx_hash: inv.tx_hash || null,
          wallet_address: inv.wallet_address || null,
        })
        .select()
        .single();

      // Insert transaction to ledger in Supabase
      await supabase.from("transactions").insert({
        user_id: inv.user_id,
        amount: amt,
        type: "investment",
        description: `${planName} Mandate Capital Allocation`,
        date: startDate,
      });

      if (!error && data) {
        return {
          ...local,
          id: data.id,
        };
      }
    } catch {
      // continue
    }
    return local;
  },

  // ─── CRITICAL ADMIN ACTION: CREDIT PAYOUT ───
  // CRITICAL ARCHITECTURE RULE:
  // Profit is NEVER calculated or credited automatically.
  // The Admin MUST manually credit the user's balance when an investment matures.
  async creditPayout(params: {
    investmentId: string;
    userId: string;
    amountInvested: number;
    profit: number;
    planName: string;
  }): Promise<{ success: boolean; payoutTotal: number; newBalance: number }> {
    const { investmentId, userId, amountInvested, profit, planName } = params;
    const payoutTotal = Math.max(0, Number(amountInvested) + Number(profit));

    // 1. Get current balance and add payout total (principal + profit)
    const currentBal = await this.getBalance(userId);
    const newBalance = currentBal + payoutTotal;

    // 2. Update user's available_balance in balances table
    await this.updateBalance(userId, newBalance);

    // 3. Mark investment as 'matured' and update current_value
    localStore.updateInvestment(investmentId, {
      status: "matured",
      current_value: payoutTotal,
    });

    try {
      await supabase
        .from("investments")
        .update({
          status: "matured",
          current_value: payoutTotal,
        })
        .eq("id", investmentId);
    } catch {
      // continue
    }

    // 4. Log the Payout transaction in the transactions audit ledger
    const txDesc = `Maturity Payout · ${planName} ($${Number(amountInvested).toLocaleString()} Capital + $${Number(profit).toLocaleString()} Yield)`;
    localStore.addTransaction({
      user_id: userId,
      amount: payoutTotal,
      type: "payout",
      description: txDesc,
      date: new Date().toISOString(),
    });

    try {
      await supabase.from("transactions").insert({
        user_id: userId,
        amount: payoutTotal,
        type: "payout",
        description: txDesc,
        date: new Date().toISOString(),
      });
    } catch {
      // continue
    }

    return {
      success: true,
      payoutTotal,
      newBalance,
    };
  },

  // ─── Transactions Audit Ledger ───
  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (!error && data && data.length > 0) {
        const parsed: Transaction[] = data.map((d) => ({
          id: d.id,
          user_id: d.user_id,
          amount: Number(d.amount || 0),
          type: d.type as "investment" | "payout" | "withdrawal",
          description: d.description || "System transaction",
          date: d.date || d.created_at || new Date().toISOString(),
          created_at: d.created_at,
        }));
        localStore.saveTransactions(parsed);
        return parsed;
      }
    } catch {
      // fallback
    }
    return localStore.getTransactions(userId);
  },

  async addTransaction(tx: {
    user_id: string;
    amount: number;
    type: "investment" | "payout" | "withdrawal";
    description: string;
    date?: string;
  }): Promise<Transaction> {
    const local = localStore.addTransaction(tx);
    try {
      await supabase.from("transactions").insert({
        user_id: tx.user_id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: tx.date || new Date().toISOString(),
      });
    } catch {
      // continue
    }
    return local;
  },

  // ─── Leads & Tickets ───
  async addLead(lead: {
    full_name: string;
    email: string;
    phone?: string;
    bot_source?: string;
    status?: string;
    notes?: string;
    converted_user_id?: string;
  }): Promise<Lead> {
    const local = localStore.addLead({
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone || null,
      country: "Global",
      investor_type: "institutional",
      status: lead.status || "new",
      notes: lead.notes || null,
    });

    try {
      await supabase.from("leads").insert({
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone || null,
        bot_source: lead.bot_source || "web_portal",
        status: lead.status || "new",
        notes: lead.notes || null,
        converted_user_id: lead.converted_user_id || null,
      });
    } catch {
      // continue
    }
    return local;
  },

  async addSupportTicket(ticket: {
    client_email: string;
    ticket_id?: string;
    query_summary: string;
    transcript: string;
    status?: string;
  }): Promise<SupportTicket> {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const finalTicketId = ticket.ticket_id || `#TICK-${code}`;

    const local = localStore.addTicket({
      ticket_id: finalTicketId,
      user_email: ticket.client_email,
      transcript: [{ role: "user", content: ticket.query_summary }],
      status: ticket.status || "open",
    });

    try {
      await supabase.from("support_tickets").insert({
        client_email: ticket.client_email,
        ticket_id: finalTicketId,
        query_summary: ticket.query_summary,
        transcript: ticket.transcript,
        status: ticket.status || "open",
      });
    } catch {
      // continue
    }
    return local;
  },
};
