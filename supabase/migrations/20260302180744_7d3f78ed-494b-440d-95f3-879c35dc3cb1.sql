
-- Create budget_targets table
CREATE TABLE public.budget_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agente text NOT NULL,
  anno integer NOT NULL,
  mese integer NOT NULL,
  importo numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agente, anno, mese)
);

-- Enable RLS
ALTER TABLE public.budget_targets ENABLE ROW LEVEL SECURITY;

-- Read: authenticated users can see budget for their assigned agents (or admin sees all)
CREATE POLICY "Users see budget by assigned agents"
  ON public.budget_targets FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR agente = ANY(get_user_agents(auth.uid()))
  );

-- Write: admin only
CREATE POLICY "Admins can insert budget"
  ON public.budget_targets FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update budget"
  ON public.budget_targets FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete budget"
  ON public.budget_targets FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed FO75 2026
INSERT INTO public.budget_targets (agente, anno, mese, importo) VALUES
  ('FO_FO75', 2026, 1, 374374),
  ('FO_FO75', 2026, 2, 436070),
  ('FO_FO75', 2026, 3, 425142),
  ('FO_FO75', 2026, 4, 478601),
  ('FO_FO75', 2026, 5, 481141),
  ('FO_FO75', 2026, 6, 443277),
  ('FO_FO75', 2026, 7, 635743),
  ('FO_FO75', 2026, 8, 342263),
  ('FO_FO75', 2026, 9, 452474),
  ('FO_FO75', 2026, 10, 427109),
  ('FO_FO75', 2026, 11, 518841),
  ('FO_FO75', 2026, 12, 484966);

-- Seed FO77 2026
INSERT INTO public.budget_targets (agente, anno, mese, importo) VALUES
  ('FO_FO77', 2026, 1, 333533),
  ('FO_FO77', 2026, 2, 388499),
  ('FO_FO77', 2026, 3, 378763),
  ('FO_FO77', 2026, 4, 426390),
  ('FO_FO77', 2026, 5, 428653),
  ('FO_FO77', 2026, 6, 394919),
  ('FO_FO77', 2026, 7, 566389),
  ('FO_FO77', 2026, 8, 304925),
  ('FO_FO77', 2026, 9, 403114),
  ('FO_FO77', 2026, 10, 380515),
  ('FO_FO77', 2026, 11, 462240),
  ('FO_FO77', 2026, 12, 432060);

-- RPC function get_budget_data
CREATE OR REPLACE FUNCTION public.get_budget_data(p_anno integer, p_agente text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  user_agents text[];
  is_admin boolean;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  WITH budget AS (
    SELECT mese, SUM(importo) as budget_tot
    FROM budget_targets b
    WHERE b.anno = p_anno
      AND (is_admin OR b.agente = ANY(user_agents))
      AND (p_agente IS NULL OR b.agente = p_agente)
    GROUP BY mese
  ),
  fatturato AS (
    SELECT mese, SUM(imponibile) as fatt_tot
    FROM sales_records s
    WHERE s.anno = p_anno
      AND s.azienda = 'FO'
      AND (is_admin OR s.agente = ANY(user_agents))
      AND (p_agente IS NULL OR s.agente = p_agente)
    GROUP BY mese
  )
  SELECT COALESCE(json_agg(json_build_object(
    'mese', m.mese,
    'budget', COALESCE(b.budget_tot, 0),
    'fatturato', COALESCE(f.fatt_tot, 0)
  ) ORDER BY m.mese), '[]'::json)
  INTO result
  FROM generate_series(1, 12) AS m(mese)
  LEFT JOIN budget b ON b.mese = m.mese
  LEFT JOIN fatturato f ON f.mese = m.mese;

  RETURN result;
END;
$$;
