
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read anagrafica" ON public.clienti_anagrafica;

-- New policy: admins see all, users see only clients linked to their agents
CREATE POLICY "Users see anagrafica by assigned agents"
ON public.clienti_anagrafica
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR nome_cliente IN (
    SELECT DISTINCT s.nome_cliente
    FROM public.sales_records s
    WHERE s.agente = ANY(get_user_agents(auth.uid()))
  )
);
