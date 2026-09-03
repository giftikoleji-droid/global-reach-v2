-- ==============================================================================
-- AETHERIS CAPITAL - SUPABASE DATABASE SCHEMA & MIGRATION SCRIPT
-- Strictly Typed Database Schema with Admin Payout Flow & Row-Level Security
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'client', -- 'client' | 'admin'
  ref_code TEXT UNIQUE,
  bonus_earned NUMERIC DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ref_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonus_earned NUMERIC DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- ------------------------------------------------------------------------------
-- 2. BALANCES TABLE (User Available Balance)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance NUMERIC NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.balances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.balances ADD COLUMN IF NOT EXISTS available_balance NUMERIC DEFAULT 0.00;
ALTER TABLE public.balances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- ------------------------------------------------------------------------------
-- 3. INVESTMENTS TABLE (Real Institutional Plans: Starter, Growth, Pro, Elite)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL, -- 'Starter' | 'Growth' | 'Pro' | 'Elite'
  plan_id TEXT,
  amount_invested NUMERIC NOT NULL,
  amount NUMERIC, -- Backward compatibility alias
  current_value NUMERIC NOT NULL,
  return_pct NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'pending' | 'active' | 'matured'
  start_date TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  end_date TIMESTAMPTZ,
  maturity_date TIMESTAMPTZ, -- Backward compatibility alias
  term_days INTEGER NOT NULL DEFAULT 30,
  tx_hash TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS plan_id TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS amount_invested NUMERIC;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS current_value NUMERIC;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS return_pct NUMERIC;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS maturity_date TIMESTAMPTZ;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS term_days INTEGER DEFAULT 30;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- ------------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE (Audit Ledger of Investments, Payouts, Withdrawals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'investment' | 'payout' | 'withdrawal'
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- ------------------------------------------------------------------------------
-- 5. REFERRALS, LEADS & SUPPORT TICKETS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_earned NUMERIC DEFAULT 0.00,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  bot_source TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT,
  ticket_id TEXT,
  query_summary TEXT,
  transcript TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ------------------------------------------------------------------------------
-- 6. AUTH SIGNUP & PROFILE INITIALIZATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_ref TEXT;
  user_role TEXT;
BEGIN
  -- Determine role based on institutional email addresses
  IF NEW.email IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com') THEN
    user_role := 'admin';
  ELSE
    user_role := 'client';
  END IF;

  -- Generate a clean 6-8 character referral code
  generated_ref := UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'AETH') FROM 1 FOR 4) || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

  -- Insert profile
  INSERT INTO public.profiles (id, name, email, role, ref_code, bonus_earned, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    user_role,
    generated_ref,
    0.00,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

  -- Initialize starting available balance for new clients ($0.00 strictly)
  INSERT INTO public.balances (user_id, available_balance, updated_at)
  VALUES (NEW.id, 0.00, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. ADMIN CHECK HELPER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR email IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com'))
    )
    OR (auth.jwt() ->> 'email') IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Clients can ONLY read/write their own data; Admins have unrestricted access
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES RLS ───
DROP POLICY IF EXISTS "Users can read own profile or admin reads all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin reads all" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile or admin updates" ON public.profiles;
CREATE POLICY "Users can update their own profile or admin updates" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ─── BALANCES RLS ───
DROP POLICY IF EXISTS "Users view own balance or admin views all" ON public.balances;
CREATE POLICY "Users view own balance or admin views all" ON public.balances
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create own balance or admin creates" ON public.balances;
CREATE POLICY "Users create own balance or admin creates" ON public.balances
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin or user updates balance" ON public.balances;
CREATE POLICY "Admin or user updates balance" ON public.balances
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ─── INVESTMENTS RLS ───
DROP POLICY IF EXISTS "Users view own investments or admin views all" ON public.investments;
CREATE POLICY "Users view own investments or admin views all" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create investments or admin creates" ON public.investments;
CREATE POLICY "Users create investments or admin creates" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin or user updates investments" ON public.investments;
CREATE POLICY "Admin or user updates investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ─── TRANSACTIONS RLS ───
DROP POLICY IF EXISTS "Users view own transactions or admin views all" ON public.transactions;
CREATE POLICY "Users view own transactions or admin views all" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin or user creates transactions" ON public.transactions;
CREATE POLICY "Admin or user creates transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ─── REFERRALS RLS ───
DROP POLICY IF EXISTS "Users view own referrals or admin views all" ON public.referrals;
CREATE POLICY "Users view own referrals or admin views all" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create referrals" ON public.referrals;
CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- ─── LEADS RLS ───
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads" ON public.leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
CREATE POLICY "Admins can view leads" ON public.leads
  FOR SELECT USING (public.is_admin());

-- ─── SUPPORT TICKETS RLS ───
DROP POLICY IF EXISTS "Anyone can submit support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can submit support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view support tickets or admin" ON public.support_tickets;
CREATE POLICY "Users can view support tickets or admin" ON public.support_tickets
  FOR SELECT USING (true);

-- ==============================================================================
-- END OF SCHEMA & RLS DEFINITIONS
-- ==============================================================================
