
-- Create cliente_referenti table
CREATE TABLE public.cliente_referenti (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codice_cliente text NOT NULL,
  nome text NOT NULL,
  ruolo text,
  telefono text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.cliente_referenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referenti" ON public.cliente_referenti
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users see referenti by assigned agents" ON public.cliente_referenti
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR codice_cliente IN (
      SELECT DISTINCT s.codice_cliente FROM sales_records s
      WHERE s.agente = ANY(get_user_agents(auth.uid()))
    )
  );

-- Create cliente_report table
CREATE TABLE public.cliente_report (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codice_cliente text NOT NULL,
  data_report date NOT NULL,
  tipo text NOT NULL,
  oggetto text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.cliente_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage report" ON public.cliente_report
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users see report by assigned agents" ON public.cliente_report
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR codice_cliente IN (
      SELECT DISTINCT s.codice_cliente FROM sales_records s
      WHERE s.agente = ANY(get_user_agents(auth.uid()))
    )
  );

-- Create indexes
CREATE INDEX idx_cliente_referenti_codice ON public.cliente_referenti(codice_cliente);
CREATE INDEX idx_cliente_report_codice ON public.cliente_report(codice_cliente);
CREATE INDEX idx_cliente_report_data ON public.cliente_report(data_report DESC);
