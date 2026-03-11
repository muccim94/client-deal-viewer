CREATE OR REPLACE FUNCTION public.get_marchio_clienti_stats(
  p_famiglia text,
  p_azienda_nome text DEFAULT NULL,
  p_anno integer DEFAULT NULL,
  p_agente text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  v_current_year := COALESCE(p_anno, EXTRACT(YEAR FROM current_date)::integer);
  v_prev_year := v_current_year - 1;

  SELECT COALESCE(MAX(mese), EXTRACT(MONTH FROM current_date)::integer)
  INTO v_max_month
  FROM sales_records s
  WHERE s.anno = v_current_year
    AND s.marchio LIKE (p_famiglia || '%')
    AND (is_admin OR s.agente = ANY(user_agents))
    AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
    AND (p_agente IS NULL OR s.agente = p_agente);

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE s.marchio LIKE (p_famiglia || '%')
      AND (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda_nome IS NULL OR s.azienda_nome = p_azienda_nome)
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_current_year, v_prev_year)
  ),
  clienti AS (
    SELECT
      codice_cliente,
      MAX(nome_cliente) as nome_cliente,
      SUM(CASE WHEN anno = v_current_year AND mese <= v_max_month THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year AND mese <= v_max_month THEN imponibile ELSE 0 END) as fatt_prev_ytd,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev_total
    FROM filtered
    GROUP BY codice_cliente
  )
  SELECT json_build_object(
    'anno_corrente', v_current_year,
    'anno_precedente', v_prev_year,
    'max_month', v_max_month,
    'clienti', COALESCE((
      SELECT json_agg(json_build_object(
        'codice_cliente', codice_cliente,
        'nome_cliente', nome_cliente,
        'fatt_current', fatt_current,
        'fatt_prev_ytd', fatt_prev_ytd,
        'fatt_prev_total', fatt_prev_total
      ) ORDER BY fatt_current DESC)
      FROM clienti
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;