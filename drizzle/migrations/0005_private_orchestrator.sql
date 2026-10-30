CREATE TABLE public.private_vault (
  user_id uuid PRIMARY KEY,
  pin_hash text NOT NULL,
  phrase_hash text NOT NULL,
  models jsonb NOT NULL DEFAULT '[]'::jsonb,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.private_vault TO service_role;
ALTER TABLE public.private_vault ENABLE ROW LEVEL SECURITY;
-- нет политик: доступ только через функции ниже

CREATE TABLE public.private_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Новая беседа',
  mode text NOT NULL DEFAULT 'single',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.private_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_messages TO authenticated;
GRANT ALL ON public.private_conversations TO service_role;
GRANT ALL ON public.private_messages TO service_role;
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_private_vault_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin') AND EXISTS (SELECT 1 FROM public.private_vault WHERE user_id = _uid)
$$;

CREATE POLICY "vault owner only" ON public.private_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_private_vault_owner(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_private_vault_owner(auth.uid()));
CREATE POLICY "vault owner only" ON public.private_messages FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_private_vault_owner(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_private_vault_owner(auth.uid()));

CREATE OR REPLACE FUNCTION public.private_vault_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RETURN jsonb_build_object('state','denied'); END IF;
  SELECT * INTO v FROM public.private_vault LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('state','setup'); END IF;
  IF v.user_id <> auth.uid() THEN RETURN jsonb_build_object('state','denied'); END IF;
  RETURN jsonb_build_object('state','locked','locked_until',v.locked_until);
END $$;

CREATE OR REPLACE FUNCTION public.private_vault_setup(_pin text, _phrase text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'denied'; END IF;
  IF EXISTS (SELECT 1 FROM public.private_vault) THEN RAISE EXCEPTION 'already configured'; END IF;
  IF _pin !~ '^[0-9]{4,12}$' THEN RAISE EXCEPTION 'PIN: 4-12 цифр'; END IF;
  IF length(coalesce(_phrase,'')) < 8 THEN RAISE EXCEPTION 'Фраза: минимум 8 символов'; END IF;
  INSERT INTO public.private_vault(user_id, pin_hash, phrase_hash)
  VALUES (auth.uid(), crypt(_pin, gen_salt('bf', 10)), crypt(_phrase, gen_salt('bf', 10)));
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.private_vault_verify(_pin text, _phrase text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RETURN jsonb_build_object('ok',false,'error','denied'); END IF;
  SELECT * INTO v FROM public.private_vault WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','denied'); END IF;
  IF v.locked_until IS NOT NULL AND v.locked_until > now() THEN
    RETURN jsonb_build_object('ok',false,'error','locked','locked_until',v.locked_until);
  END IF;
  IF v.pin_hash = crypt(_pin, v.pin_hash) AND v.phrase_hash = crypt(_phrase, v.phrase_hash) THEN
    UPDATE public.private_vault SET failed_attempts = 0, locked_until = NULL WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok',true,'models',v.models);
  END IF;
  UPDATE public.private_vault SET failed_attempts = failed_attempts + 1,
    locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
    failed_attempts = CASE WHEN failed_attempts + 1 >= 5 THEN 0 ELSE failed_attempts + 1 END
  WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok',false,'error','wrong');
END $$;

CREATE OR REPLACE FUNCTION public.private_vault_change(_old_pin text, _old_phrase text, _pin text, _phrase text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v record;
BEGIN
  SELECT * INTO v FROM public.private_vault WHERE user_id = auth.uid() AND public.has_role(auth.uid(),'admin');
  IF NOT FOUND OR v.pin_hash <> crypt(_old_pin, v.pin_hash) OR v.phrase_hash <> crypt(_old_phrase, v.phrase_hash) THEN RAISE EXCEPTION 'Неверные текущие данные'; END IF;
  IF _pin !~ '^[0-9]{4,12}$' THEN RAISE EXCEPTION 'PIN: 4-12 цифр'; END IF;
  IF length(coalesce(_phrase,'')) < 8 THEN RAISE EXCEPTION 'Фраза: минимум 8 символов'; END IF;
  UPDATE public.private_vault SET pin_hash = crypt(_pin, gen_salt('bf',10)), phrase_hash = crypt(_phrase, gen_salt('bf',10)), updated_at = now() WHERE user_id = auth.uid();
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.private_vault_set_models(_models jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF jsonb_typeof(_models) <> 'array' OR jsonb_array_length(_models) > 60 THEN RAISE EXCEPTION 'invalid'; END IF;
  UPDATE public.private_vault SET models = _models, updated_at = now() WHERE user_id = auth.uid() AND public.has_role(auth.uid(),'admin');
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.private_vault_wipe()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.is_private_vault_owner(auth.uid()) THEN RAISE EXCEPTION 'denied'; END IF;
  DELETE FROM public.private_conversations WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE EXECUTE ON FUNCTION public.private_vault_status(), public.private_vault_setup(text,text), public.private_vault_verify(text,text), public.private_vault_change(text,text,text,text), public.private_vault_set_models(jsonb), public.private_vault_wipe(), public.is_private_vault_owner(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.private_vault_status(), public.private_vault_setup(text,text), public.private_vault_verify(text,text), public.private_vault_change(text,text,text,text), public.private_vault_set_models(jsonb), public.private_vault_wipe(), public.is_private_vault_owner(uuid) TO authenticated;