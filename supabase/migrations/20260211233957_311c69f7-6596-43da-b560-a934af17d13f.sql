
CREATE OR REPLACE FUNCTION public.get_user_agents(_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to query their own agents, or admins to query anyone
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RETURN '{}'::text[];
  END IF;

  RETURN (
    SELECT COALESCE(array_agg(agente), '{}'::text[])
    FROM public.user_agents
    WHERE user_id = _user_id
  );
END;
$$;
