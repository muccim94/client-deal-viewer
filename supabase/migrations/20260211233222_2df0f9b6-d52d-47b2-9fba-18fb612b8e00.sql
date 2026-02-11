
-- 1. Create user_agents table
CREATE TABLE public.user_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agente text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, agente)
);

ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

-- 2. Create get_user_agents helper function (security definer)
CREATE OR REPLACE FUNCTION public.get_user_agents(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(agente), '{}')
  FROM public.user_agents
  WHERE user_id = _user_id
$$;

-- 3. RLS policies on user_agents
-- SELECT: users see own, admin sees all
CREATE POLICY "Users can read own agents"
  ON public.user_agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- INSERT: admin only
CREATE POLICY "Admins can insert agents"
  ON public.user_agents FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- DELETE: admin only
CREATE POLICY "Admins can delete agents"
  ON public.user_agents FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 4. Drop old SELECT policy on sales_records and create new filtered one
DROP POLICY IF EXISTS "Authenticated users can view all records" ON public.sales_records;

CREATE POLICY "Users see records by assigned agents"
  ON public.sales_records FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR agente = ANY(get_user_agents(auth.uid()))
  );
