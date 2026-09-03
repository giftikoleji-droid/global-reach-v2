-- Support ticket hardening: preserve existing auth/RLS flows while adding
-- client identity fields and a database-level unique ticket reference.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS support_tickets_ticket_id_unique
  ON public.support_tickets(ticket_id);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx
  ON public.support_tickets(user_id);

CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx
  ON public.support_tickets(created_at DESC);

-- Keep ticket creation available to the support Edge Function and clients
-- through the existing controlled INSERT policy. Reading remains governed by
-- the existing admin-only hardening migration.
