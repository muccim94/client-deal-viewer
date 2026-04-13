
-- Fix 1: cliente_incentivazioni policies from {public} to {authenticated}
DROP POLICY "Admins can view incentivazioni" ON public.cliente_incentivazioni;
DROP POLICY "Admins can insert incentivazioni" ON public.cliente_incentivazioni;
DROP POLICY "Admins can update incentivazioni" ON public.cliente_incentivazioni;
DROP POLICY "Admins can delete incentivazioni" ON public.cliente_incentivazioni;

CREATE POLICY "Admins can view incentivazioni" ON public.cliente_incentivazioni
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert incentivazioni" ON public.cliente_incentivazioni
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update incentivazioni" ON public.cliente_incentivazioni
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete incentivazioni" ON public.cliente_incentivazioni
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: clienti_anagrafica ALL policy from {public} to {authenticated}
DROP POLICY "Admins can manage anagrafica" ON public.clienti_anagrafica;

CREATE POLICY "Admins can manage anagrafica" ON public.clienti_anagrafica
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
