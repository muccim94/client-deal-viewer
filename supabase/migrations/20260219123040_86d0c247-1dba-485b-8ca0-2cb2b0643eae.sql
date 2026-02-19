
-- Create cliente_incentivazioni table
CREATE TABLE public.cliente_incentivazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_cliente text NOT NULL,
  nome_cliente text NOT NULL,
  anno integer NOT NULL,
  note text,
  righe jsonb NOT NULL,
  totale_fatturato numeric NOT NULL,
  totale_premi numeric NOT NULL,
  incidenza numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.cliente_incentivazioni ENABLE ROW LEVEL SECURITY;

-- SELECT: only admin can view incentivazioni
CREATE POLICY "Admins can view incentivazioni"
  ON public.cliente_incentivazioni
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: only admin
CREATE POLICY "Admins can insert incentivazioni"
  ON public.cliente_incentivazioni
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: only admin
CREATE POLICY "Admins can update incentivazioni"
  ON public.cliente_incentivazioni
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELETE: only admin
CREATE POLICY "Admins can delete incentivazioni"
  ON public.cliente_incentivazioni
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
