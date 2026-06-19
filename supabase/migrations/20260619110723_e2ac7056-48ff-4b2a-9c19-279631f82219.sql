CREATE OR REPLACE FUNCTION public.generate_plan_public_hash()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  candidate text;
  exists_already boolean;
BEGIN
  LOOP
    candidate := substr(translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/=', '-_x'), 1, 12);
    SELECT EXISTS(SELECT 1 FROM public.treatment_plans WHERE public_hash = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$function$;