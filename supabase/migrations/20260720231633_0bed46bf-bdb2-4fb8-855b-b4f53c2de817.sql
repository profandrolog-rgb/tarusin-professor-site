-- Prevent users from escalating their own user_type; admins may still change it.
CREATE OR REPLACE FUNCTION public.prevent_user_type_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type IS DISTINCT FROM OLD.user_type
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Changing user_type is not allowed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_user_type_self_change ON public.profiles;
CREATE TRIGGER profiles_prevent_user_type_self_change
BEFORE UPDATE OF user_type ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_type_self_change();