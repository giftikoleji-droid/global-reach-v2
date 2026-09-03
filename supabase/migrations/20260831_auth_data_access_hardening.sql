-- Aetheris Capital: authentication/data-access hardening
--
-- The original schema allowed authenticated clients to mutate financial ledger
-- records and, in a few cases, read data belonging to other users. This
-- migration tightens those policies without changing the application schema.

-- -----------------------------------------------------------------------------
-- BALANCES: clients may read their balance, but only admins may mutate it.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users create own balance or admin creates" ON public.balances;
CREATE POLICY "Admin creates balances" ON public.balances
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin or user updates balance" ON public.balances;
CREATE POLICY "Admin updates balances" ON public.balances
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- INVESTMENTS: clients can submit their own investment request, but only
-- admins can modify an existing record or create records for another user.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin or user updates investments" ON public.investments;
CREATE POLICY "Admin updates investments" ON public.investments
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Keep the existing own-row INSERT policy, but make the rule explicit so it
-- cannot accidentally become an unrestricted insert during later migrations.
DROP POLICY IF EXISTS "Users create investments or admin creates" ON public.investments;
CREATE POLICY "Users create own investment requests" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- TRANSACTIONS: the ledger is server/admin controlled. Clients can read their
-- own entries but cannot manufacture or alter financial history.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin or user creates transactions" ON public.transactions;
CREATE POLICY "Admin creates transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.is_admin());

-- The original schema did not define a transaction UPDATE policy. Keep it that
-- way: there is deliberately no client UPDATE/DELETE access.

-- -----------------------------------------------------------------------------
-- REFERRALS: prevent anonymous/unauthenticated clients from inserting rows for
-- arbitrary users. A client may only create a referral where they are the
-- referrer; admins retain unrestricted access.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users create referrals" ON public.referrals;
CREATE POLICY "Users create own referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- SUPPORT TICKETS: the old SELECT policy used USING (true), exposing every
-- ticket/transcript to every client. Until support_tickets has a proper
-- auth.users foreign key, only admins may read the table.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view support tickets or admin" ON public.support_tickets;
CREATE POLICY "Admins can view support tickets" ON public.support_tickets
  FOR SELECT USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- PROFILES: prevent clients from elevating themselves to admin or changing
-- bonus balances. The existing own-profile UPDATE policy is replaced with a
-- column-level trigger plus the same ownership rule.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.bonus_earned := OLD.bonus_earned;
    NEW.email := OLD.email;
    NEW.ref_code := OLD.ref_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();
