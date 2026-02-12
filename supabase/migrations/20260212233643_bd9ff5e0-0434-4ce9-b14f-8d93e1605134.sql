
-- user_roles: Block direct inserts (handled by trigger)
CREATE POLICY "No one can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- user_roles: Block direct deletes
CREATE POLICY "No one can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);
