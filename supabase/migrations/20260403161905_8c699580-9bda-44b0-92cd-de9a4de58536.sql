
CREATE OR REPLACE FUNCTION public.get_provvigioni_chart(
  p_azienda text DEFAULT NULL,
  p_mese_da integer DEFAULT NULL,
  p_mese_a integer DEFAULT NULL,
  p_agente text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  user_agents text[];
  is_admin boolean;
  v_current_year integer;
  v_prev_year integer;
  v_max_month integer;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  v_current_year := EXTRACT(YEAR FROM current_date)::integer;
  v_prev_year := v_current_year - 1;

  -- Find last month with data in current year (fallback)
  SELECT COALESCE(MAX(mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_max_month
  FROM sales_records s
  WHERE s.anno = v_current_year
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_azienda IS NULL OR s.azienda = p_azienda);

  -- If user specified p_mese_a, use it directly (allows expanding beyond data)
  IF p_mese_a IS NOT NULL THEN
    v_max_month := p_mese_a;
  END IF;

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_current_year, v_prev_year)
  ),
  totals AS (
    SELECT
      SUM(CASE WHEN anno = v_current_year
           AND (p_mese_da IS NULL OR mese >= p_mese_da)
           AND mese <= v_max_month
           THEN provvigione ELSE 0 END) as total_current,
      SUM(CASE WHEN anno = v_prev_year
           AND (p_mese_da IS NULL OR mese >= p_mese_da)
           AND mese <= v_max_month
           THEN provvigione ELSE 0 END) as total_prev
    FROM filtered
  ),
  monthly AS (
    SELECT
      mese,
      SUM(CASE WHEN anno = v_current_year THEN provvigione ELSE 0 END) as provv_current,
      SUM(CASE WHEN anno = v_prev_year THEN provvigione ELSE 0 END) as provv_prev
    FROM filtered
    GROUP BY mese
    ORDER BY mese
  )
  SELECT json_build_object(
    'total_current', (SELECT COALESCE(total_current, 0) FROM totals),
    'total_prev', (SELECT COALESCE(total_prev, 0) FROM totals),
    'max_month', v_max_month,
    'current_year', v_current_year,
    'prev_year', v_prev_year,
    'monthly_totals', (SELECT COALESCE(json_agg(json_build_object(
      'mese', mese,
      'provv_current', provv_current,
      'provv_prev', provv_prev
    )), '[]'::json) FROM monthly)
  ) INTO result;

  RETURN result;
END;
$function$;
