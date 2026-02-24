
CREATE OR REPLACE FUNCTION public.get_marchi_stats(p_azienda_nome text DEFAULT NULL::text, p_anno integer DEFAULT NULL::integer, p_mese integer DEFAULT NULL::integer, p_agente text DEFAULT NULL::text)
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

  -- Find the max month with data in the current year for YTD comparison
  SELECT COALESCE(MAX(mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_max_month
  FROM sales_records s
  WHERE s.anno = v_current_year
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome);

  -- KPI data (filtered by all params)
  WITH kpi_filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
      AND (p_anno IS NULL OR s.anno = p_anno)
      AND (p_mese IS NULL OR s.mese = p_mese)
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
  -- Table data (filtered only by azienda, shows current/prev year comparison)
  table_filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
  ),
  brands AS (
    SELECT
      marchio,
      SUM(CASE WHEN anno = v_current_year THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev,
      SUM(CASE WHEN anno = v_prev_year AND mese <= v_max_month THEN imponibile ELSE 0 END) as fatt_prev_ytd
    FROM table_filtered
    GROUP BY marchio
  )
  SELECT json_build_object(
    'kpi', (SELECT row_to_json(kpi) FROM kpi),
    'brands', (SELECT COALESCE(json_agg(json_build_object(
      'marchio', marchio,
      'fattCurrentYear', fatt_current,
      'fattPrevYear', fatt_prev,
      'fattPrevYearYTD', fatt_prev_ytd
    )), '[]'::json) FROM brands)
  ) INTO result;

  RETURN result;
END;
$function$;
