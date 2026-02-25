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
  v_current_month := EXTRACT(MONTH FROM current_date)::integer;

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