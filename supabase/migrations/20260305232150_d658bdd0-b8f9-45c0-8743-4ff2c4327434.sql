
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_azienda text DEFAULT NULL::text, p_anno integer DEFAULT NULL::integer, p_mese integer DEFAULT NULL::integer, p_agente text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  user_agents text[];
  is_admin boolean;
  v_anno integer;
  v_prev_anno integer;
  v_current_month integer;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  v_anno := COALESCE(p_anno, EXTRACT(YEAR FROM current_date)::integer);
  v_prev_anno := v_anno - 1;

  -- Use max month with data instead of current calendar month
  SELECT COALESCE(MAX(s.mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_current_month
  FROM sales_records s
  WHERE s.anno = v_anno
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_azienda IS NULL OR s.azienda = p_azienda)
    AND (p_agente IS NULL OR s.agente = p_agente);

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_anno IS NULL OR s.anno = p_anno)
      AND (p_mese IS NULL OR s.mese = p_mese)
      AND (p_agente IS NULL OR s.agente = p_agente)
  ),
  kpi AS (
    SELECT
      COALESCE(SUM(imponibile), 0) as totale,
      COUNT(DISTINCT codice_cliente) as clienti,
      COUNT(DISTINCT marchio) as marchi
    FROM filtered
  ),
  top_clienti_base AS (
    SELECT
      s.nome_cliente as name,
      s.codice_cliente as codice,
      SUM(CASE WHEN s.anno = v_anno AND s.mese <= v_current_month THEN s.imponibile ELSE 0 END) as value,
      SUM(CASE WHEN s.anno = v_prev_anno AND s.mese <= v_current_month THEN s.imponibile ELSE 0 END) as value_prev
    FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_anno, v_prev_anno)
      AND s.mese <= v_current_month
    GROUP BY s.nome_cliente, s.codice_cliente
    ORDER BY value DESC
    LIMIT 10
  ),
  marchi_pie AS (
    SELECT
      marchio as name,
      SUM(imponibile) as value
    FROM filtered
    GROUP BY marchio
    ORDER BY value DESC
    LIMIT 8
  )
  SELECT json_build_object(
    'totale', (SELECT totale FROM kpi),
    'clienti', (SELECT clienti FROM kpi),
    'marchi', (SELECT marchi FROM kpi),
    'topClienti', (SELECT COALESCE(json_agg(json_build_object('name', name, 'codice', codice, 'value', value, 'valuePrev', value_prev)), '[]'::json) FROM top_clienti_base),
    'marchiPie', (SELECT COALESCE(json_agg(json_build_object('name', name, 'value', value)), '[]'::json) FROM marchi_pie)
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_clienti_list(p_agente text DEFAULT NULL::text)
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
  v_current_month integer;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  v_current_year := EXTRACT(YEAR FROM current_date)::integer;
  v_prev_year := v_current_year - 1;

  -- Use max month with data instead of current calendar month
  SELECT COALESCE(MAX(s.mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_current_month
  FROM sales_records s
  WHERE s.anno = v_current_year
    AND s.azienda = 'FO'
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_agente IS NULL OR s.agente = p_agente);

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.azienda = 'FO'
  ),
  grouped AS (
    SELECT
      codice_cliente,
      MAX(nome_cliente) as nome_cliente,
      SUM(CASE WHEN anno = v_current_year AND mese <= v_current_month THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year AND mese <= v_current_month THEN imponibile ELSE 0 END) as fatt_prev_ytd,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev_full
    FROM filtered
    GROUP BY codice_cliente
  )
  SELECT COALESCE(json_agg(json_build_object(
    'codiceCliente', codice_cliente,
    'nomeCliente', nome_cliente,
    'fattCurrentYear', fatt_current,
    'fattPrevYearYTD', fatt_prev_ytd,
    'fattPrevYear', fatt_prev_full
  )), '[]'::json) INTO result FROM grouped;

  RETURN result;
END;
$function$;
