
-- =============================================
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- =============================================

-- sales_records: Drop existing
DROP POLICY "Admins can delete records" ON public.sales_records;
DROP POLICY "Admins can insert records" ON public.sales_records;
DROP POLICY "Admins can update records" ON public.sales_records;
DROP POLICY "Users see records by assigned agents" ON public.sales_records;

-- sales_records: Recreate as PERMISSIVE
CREATE POLICY "Users see records by assigned agents"
  ON public.sales_records FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR (agente = ANY (get_user_agents(auth.uid()))));

CREATE POLICY "Admins can insert records"
  ON public.sales_records FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update records"
  ON public.sales_records FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete records"
  ON public.sales_records FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_agents: Drop existing
DROP POLICY "Admins can delete agents" ON public.user_agents;
DROP POLICY "Admins can insert agents" ON public.user_agents;
DROP POLICY "Admins can update agents" ON public.user_agents;
DROP POLICY "Users can read own agents" ON public.user_agents;

-- user_agents: Recreate as PERMISSIVE
CREATE POLICY "Users can read own agents"
  ON public.user_agents FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert agents"
  ON public.user_agents FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update agents"
  ON public.user_agents FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agents"
  ON public.user_agents FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: Drop existing
DROP POLICY "No one can delete roles" ON public.user_roles;
DROP POLICY "No one can insert roles" ON public.user_roles;
DROP POLICY "No one can update roles" ON public.user_roles;
DROP POLICY "Users can read own roles" ON public.user_roles;

-- user_roles: Recreate as PERMISSIVE
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "No one can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No one can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);
