
-- 1. Dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_azienda text DEFAULT NULL,
  p_anno integer DEFAULT NULL,
  p_mese integer DEFAULT NULL,
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
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

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
  top_clienti AS (
    SELECT
      nome_cliente as name,
      codice_cliente as codice,
      SUM(imponibile) as value
    FROM filtered
    GROUP BY nome_cliente, codice_cliente
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
    'topClienti', (SELECT COALESCE(json_agg(json_build_object('name', name, 'codice', codice, 'value', value)), '[]'::json) FROM top_clienti),
    'marchiPie', (SELECT COALESCE(json_agg(json_build_object('name', name, 'value', value)), '[]'::json) FROM marchi_pie)
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. Clienti list RPC
CREATE OR REPLACE FUNCTION public.get_clienti_list(
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
  ),
  grouped AS (
    SELECT
      codice_cliente,
      MAX(nome_cliente) as nome_cliente,
      SUM(CASE WHEN anno = v_current_year THEN imponibile ELSE 0 END) as fatt_current,
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev
    FROM filtered
    GROUP BY codice_cliente
  )
  SELECT COALESCE(json_agg(json_build_object(
    'codiceCliente', codice_cliente,
    'nomeCliente', nome_cliente,
    'fattCurrentYear', fatt_current,
    'fattPrevYear', fatt_prev
  )), '[]'::json) INTO result FROM grouped;

  RETURN result;
END;
$$;

-- 3. Provvigioni grouped RPC
CREATE OR REPLACE FUNCTION public.get_provvigioni_grouped(
  p_azienda text DEFAULT NULL,
  p_anno integer DEFAULT NULL,
  p_mese integer DEFAULT NULL
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
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
      AND (p_azienda IS NULL OR s.azienda = p_azienda)
      AND (p_anno IS NULL OR s.anno = p_anno)
      AND (p_mese IS NULL OR s.mese = p_mese)
  ),
  grouped AS (
    SELECT
      codice_cliente as codice,
      MAX(nome_cliente) as nome,
      MAX(azienda) as azienda,
      MAX(azienda_nome) as azienda_nome,
      SUM(provvigione) as totale
    FROM filtered
    GROUP BY codice_cliente
    ORDER BY totale DESC
  )
  SELECT COALESCE(json_agg(json_build_object(
    'codice', codice,
    'nome', nome,
    'azienda', azienda,
    'aziendaNome', azienda_nome,
    'totale', totale
  )), '[]'::json) INTO result FROM grouped;

  RETURN result;
END;
$$;

-- 4. Cliente detail RPC
CREATE OR REPLACE FUNCTION public.get_cliente_detail(
  p_codice_cliente text
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
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE s.codice_cliente = p_codice_cliente
      AND (is_admin OR s.agente = ANY(user_agents))
  )
  SELECT COALESCE(json_agg(json_build_object(
    'azienda', azienda,
    'aziendaNome', azienda_nome,
    'anno', anno,
    'mese', mese,
    'codiceCliente', codice_cliente,
    'nomeCliente', nome_cliente,
    'agente', agente,
    'marchio', marchio,
    'articolo', articolo,
    'imponibile', imponibile,
    'provvigione', provvigione,
    'fatturaRiga', fattura_riga
  )), '[]'::json) INTO result FROM filtered;

  RETURN result;
END;
$$;

-- 5. Marchi stats RPC
CREATE OR REPLACE FUNCTION public.get_marchi_stats(
  p_azienda_nome text DEFAULT NULL,
  p_anno integer DEFAULT NULL,
  p_mese integer DEFAULT NULL,
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
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  v_current_year := EXTRACT(YEAR FROM current_date)::integer;
  v_prev_year := v_current_year - 1;

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
      SUM(CASE WHEN anno = v_prev_year THEN imponibile ELSE 0 END) as fatt_prev
    FROM table_filtered
    GROUP BY marchio
  )
  SELECT json_build_object(
    'kpi', (SELECT row_to_json(kpi) FROM kpi),
    'brands', (SELECT COALESCE(json_agg(json_build_object(
      'marchio', marchio,
      'fattCurrentYear', fatt_current,
      'fattPrevYear', fatt_prev
    )), '[]'::json) FROM brands)
  ) INTO result;

  RETURN result;
END;
$$;

-- 6. Record count RPC (for upload page)
CREATE OR REPLACE FUNCTION public.get_record_count()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cnt integer;
  user_agents text[];
  is_admin boolean;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents := get_user_agents(auth.uid());
  END IF;

  SELECT COUNT(*) INTO cnt FROM sales_records s
  WHERE (is_admin OR s.agente = ANY(user_agents));

  RETURN cnt;
END;
$$;

-- 7. Distinct agents RPC (for filter dropdowns)
CREATE OR REPLACE FUNCTION public.get_visible_agents()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_agents_arr text[];
  is_admin boolean;
BEGIN
  is_admin := has_role(auth.uid(), 'admin');
  IF NOT is_admin THEN
    user_agents_arr := get_user_agents(auth.uid());
    RETURN user_agents_arr;
  END IF;

  RETURN (SELECT COALESCE(array_agg(DISTINCT agente ORDER BY agente), '{}'::text[])
    FROM sales_records WHERE agente IS NOT NULL AND agente != '');
END;
$$;

-- 8. Available years/months for filters
CREATE OR REPLACE FUNCTION public.get_filter_options()
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

  WITH filtered AS (
    SELECT * FROM sales_records s
    WHERE (is_admin OR s.agente = ANY(user_agents))
  )
  SELECT json_build_object(
    'anni', (SELECT COALESCE(json_agg(DISTINCT anno ORDER BY anno), '[]'::json) FROM filtered),
    'mesi', (SELECT COALESCE(json_agg(DISTINCT mese ORDER BY mese), '[]'::json) FROM filtered),
    'agenti', (SELECT COALESCE(json_agg(DISTINCT agente ORDER BY agente), '[]'::json) FROM filtered WHERE agente IS NOT NULL AND agente != '')
  ) INTO result;

  RETURN result;
END;
$$;
