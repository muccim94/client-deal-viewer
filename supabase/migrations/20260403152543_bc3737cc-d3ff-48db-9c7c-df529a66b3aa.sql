
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
  totale_prev AS (
    SELECT COALESCE(SUM(imponibile), 0) as totale_prev_ytd
    FROM sales_records s
    WHERE s.anno = v_prev_anno
      AND s.mese <= v_current_month
      AND (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_agente IS NULL OR s.agente = p_agente)
  ),
  top_clienti_base AS (
    SELECT
      MAX(s.nome_cliente) as name,
      s.codice_cliente as codice,
      SUM(CASE WHEN s.anno = v_anno AND s.mese <= v_current_month THEN s.imponibile ELSE 0 END) as value,
      SUM(CASE WHEN s.anno = v_prev_anno AND s.mese <= v_current_month THEN s.imponibile ELSE 0 END) as value_prev
    FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_anno, v_prev_anno)
      AND s.mese <= v_current_month
    GROUP BY s.codice_cliente
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
  ),
  monthly_totals AS (
    SELECT
      mese,
      SUM(CASE WHEN anno = v_anno THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_anno THEN imponibile ELSE 0 END) as fatt_prev
    FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_anno, v_prev_anno)
    GROUP BY mese
    ORDER BY mese
  )
  SELECT json_build_object(
    'totale', (SELECT totale FROM kpi),
    'clienti', (SELECT clienti FROM kpi),
    'marchi', (SELECT marchi FROM kpi),
    'totalePrevYtd', (SELECT totale_prev_ytd FROM totale_prev),
    'topClienti', (SELECT COALESCE(json_agg(json_build_object('name', name, 'codice', codice, 'value', value, 'valuePrev', value_prev)), '[]'::json) FROM top_clienti_base),
    'marchiPie', (SELECT COALESCE(json_agg(json_build_object('name', name, 'value', value)), '[]'::json) FROM marchi_pie),
    'monthlyTotals', (SELECT COALESCE(json_agg(json_build_object('mese', mese, 'fatt_current', fatt_current, 'fatt_prev', fatt_prev)), '[]'::json) FROM monthly_totals)
  ) INTO result;

  RETURN result;
END;
$function$;
