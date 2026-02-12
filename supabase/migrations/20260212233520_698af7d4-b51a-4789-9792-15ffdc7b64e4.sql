
-- sales_records: Only admins can update
CREATE POLICY "Admins can update records"
  ON public.sales_records FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_agents: Only admins can update
CREATE POLICY "Admins can update agents"
  ON public.user_agents FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: Prevent all updates
CREATE POLICY "No one can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);
