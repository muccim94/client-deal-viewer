
DROP FUNCTION IF EXISTS public.get_marchi_stats(text, integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_marchi_stats(
  p_azienda_nome text DEFAULT NULL,
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

  SELECT COALESCE(MAX(mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_max_month
  FROM sales_records s
  WHERE s.anno = v_current_year
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome);

  IF p_mese_a IS NOT NULL AND p_mese_a < v_max_month THEN
    v_max_month := p_mese_a;
  END IF;

  WITH kpi_filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
      AND s.anno = v_current_year
      AND (p_mese_da IS NULL OR s.mese >= p_mese_da)
      AND (p_mese_a IS NULL OR s.mese <= p_mese_a)
      AND (p_agente IS NULL OR s.agente = p_agente)
  ),
  kpi AS (
    SELECT
      COALESCE(SUM(CASE WHEN marchio NOT IN ('FV.','CV.') AND marchio NOT LIKE '*RI%' THEN imponibile ELSE 0 END), 0) as mat_elettrico,
      COALESCE(SUM(CASE WHEN marchio = 'FV.' THEN imponibile ELSE 0 END), 0) as fotovoltaico,
      COALESCE(SUM(CASE WHEN marchio = 'CV.' THEN imponibile ELSE 0 END), 0) as cavo,
      COALESCE(SUM(CASE WHEN marchio LIKE '*RI%' THEN imponibile ELSE 0 END), 0) as ricambi
    FROM kpi_filtered
  ),
  table_filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
      AND (p_agente IS NULL OR s.agente = p_agente)
  ),
  brands AS (
    SELECT
      marchio,
      SUM(CASE WHEN anno = v_current_year AND (p_mese_da IS NULL OR mese >= p_mese_da) AND (p_mese_a IS NULL OR mese <= p_mese_a) THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev,
      SUM(CASE WHEN anno = v_prev_year AND (p_mese_da IS NULL OR mese >= p_mese_da) AND mese <= v_max_month THEN imponibile ELSE 0 END) as fatt_prev_ytd
    FROM table_filtered
    GROUP BY marchio
  ),
  monthly_agg AS (
    SELECT
      mese,
      SUM(CASE WHEN anno = v_current_year THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev
    FROM table_filtered
    WHERE anno IN (v_current_year, v_prev_year)
    GROUP BY mese
    ORDER BY mese
  ),
  top_brands AS (
    SELECT marchio FROM brands ORDER BY fatt_current DESC LIMIT 20
  ),
  brand_monthly_agg AS (
    SELECT
      tf.marchio,
      tf.mese,
      SUM(CASE WHEN tf.anno = v_current_year THEN tf.imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN tf.anno = v_prev_year THEN tf.imponibile ELSE 0 END) as fatt_prev
    FROM table_filtered tf
    INNER JOIN top_brands tb ON tf.marchio = tb.marchio
    WHERE tf.anno IN (v_current_year, v_prev_year)
    GROUP BY tf.marchio, tf.mese
    ORDER BY tf.marchio, tf.mese
  )
  SELECT json_build_object(
    'kpi', (SELECT row_to_json(kpi) FROM kpi),
    'max_month', v_max_month,
    'brands', (SELECT COALESCE(json_agg(json_build_object(
      'marchio', marchio,
      'fattCurrentYear', fatt_current,
      'fattPrevYear', fatt_prev,
      'fattPrevYearYTD', fatt_prev_ytd
    )), '[]'::json) FROM brands),
    'monthly_totals', (SELECT COALESCE(json_agg(json_build_object(
      'mese', mese,
      'fatt_current', fatt_current,
      'fatt_prev', fatt_prev
    )), '[]'::json) FROM monthly_agg),
    'brand_monthly', (SELECT COALESCE(json_agg(json_build_object(
      'marchio', marchio,
      'mese', mese,
      'fatt_current', fatt_current,
      'fatt_prev', fatt_prev
    )), '[]'::json) FROM brand_monthly_agg)
  ) INTO result;

  RETURN result;
END;
$function$;
