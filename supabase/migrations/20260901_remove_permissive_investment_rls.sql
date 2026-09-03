DROP POLICY IF EXISTS "Allow all investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users manage own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;

CREATE POLICY "Users can view own investments" ON public.investments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'email') IN ('giftese911@gmail.com', 'aetheriscapital.support@gmail.com')
  );
