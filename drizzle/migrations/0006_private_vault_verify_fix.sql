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
  IF v.failed_attempts + 1 >= 5 THEN
    UPDATE public.private_vault SET failed_attempts = 0, locked_until = now() + interval '15 minutes' WHERE user_id = auth.uid();
    RETURN jsonb_build_object('ok',false,'error','locked','locked_until',now() + interval '15 minutes');
  END IF;
  UPDATE public.private_vault SET failed_attempts = failed_attempts + 1 WHERE user_id = auth.uid();
  RETURN jsonb_build_object('ok',false,'error','wrong','left',4 - v.failed_attempts);
END $$;