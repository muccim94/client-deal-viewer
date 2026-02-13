CREATE OR REPLACE FUNCTION public.get_distinct_agents()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT agente ORDER BY agente), '{}'::text[])
  FROM public.sales_records
  WHERE agente IS NOT NULL AND agente != ''
$$;