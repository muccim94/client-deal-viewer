
CREATE OR REPLACE FUNCTION public.get_fatturato_riepilogo(p_agente text DEFAULT NULL)
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
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  v_current_year := EXTRACT(YEAR FROM current_date)::integer;
  v_prev_year := v_current_year - 1;

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_agente IS NULL OR s.agente = p_agente)
      AND s.anno IN (v_current_year, v_prev_year)
  ),
  monthly AS (
    SELECT
      azienda,
      azienda_nome,
      mese,
      SUM(CASE WHEN anno = v_current_year THEN imponibile ELSE 0 END) as fatt_corrente,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_precedente
    FROM filtered
    GROUP BY azienda, azienda_nome, mese
    ORDER BY azienda, mese
  )
  SELECT json_build_object(
    'annoCorrente', v_current_year,
    'annoPrecedente', v_prev_year,
    'dati', COALESCE(json_agg(json_build_object(
      'azienda', azienda,
      'aziendaNome', azienda_nome,
      'mese', mese,
      'fattCorrente', fatt_corrente,
      'fattPrecedente', fatt_precedente
    )), '[]'::json)
  ) INTO result FROM monthly;

  RETURN result;
END;
$$;
