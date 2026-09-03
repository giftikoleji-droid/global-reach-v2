-- Prevent clients from directly authorizing active investments or reusing TX hashes.
DROP POLICY IF EXISTS "Users create investments or admin creates" ON public.investments;
DROP POLICY IF EXISTS "Users create pending investments or admin creates" ON public.investments;
CREATE POLICY "Users create pending investments or admin creates" ON public.investments
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND status = 'pending')
    OR (auth.jwt() ->> 'email') IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com')
  );

DROP POLICY IF EXISTS "Admin or user updates investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update pending investments or admin updates" ON public.investments;
CREATE POLICY "Users can update pending investments or admin updates" ON public.investments
  FOR UPDATE
  USING (
    (auth.uid() = user_id AND status = 'pending')
    OR (auth.jwt() ->> 'email') IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com')
  )
  WITH CHECK (
    (auth.uid() = user_id AND status = 'pending')
    OR (auth.jwt() ->> 'email') IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com')
  );

CREATE UNIQUE INDEX IF NOT EXISTS investments_tx_hash_unique
  ON public.investments (lower(tx_hash))
  WHERE tx_hash IS NOT NULL;

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS tx_verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS tx_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tx_confirmations INTEGER,
  ADD COLUMN IF NOT EXISTS tx_verification_error TEXT;
