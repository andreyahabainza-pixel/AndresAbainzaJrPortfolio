CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.bootstrap_staff(
  _username TEXT,
  _full_name TEXT,
  _role public.app_role,
  _pin TEXT DEFAULT NULL
)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_any_staff BOOLEAN;
  _final_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  IF _username !~ '^[A-Za-z0-9_]{3,40}$' THEN
    RAISE EXCEPTION 'Username must be 3-40 letters, numbers, or underscores';
  END IF;

  IF char_length(trim(_full_name)) < 2 OR char_length(trim(_full_name)) > 100 THEN
    RAISE EXCEPTION 'Full name must be 2-100 characters';
  END IF;

  IF _pin IS NOT NULL AND _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be 6 digits';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO _has_any_staff;
  _final_role := CASE WHEN _has_any_staff THEN 'cashier'::public.app_role ELSE 'admin'::public.app_role END;

  IF _has_any_staff AND NOT public.has_role(auth.uid(), 'admin') THEN
    _final_role := 'cashier'::public.app_role;
  ELSIF public.has_role(auth.uid(), 'admin') THEN
    _final_role := _role;
  END IF;

  INSERT INTO public.staff_profiles (user_id, username, full_name, pin_hash)
  VALUES (auth.uid(), lower(_username), trim(_full_name), CASE WHEN _pin IS NULL THEN NULL ELSE crypt(_pin, gen_salt('bf')) END)
  ON CONFLICT (user_id) DO UPDATE SET
    username = excluded.username,
    full_name = excluded.full_name,
    pin_hash = COALESCE(excluded.pin_hash, public.staff_profiles.pin_hash),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _final_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _final_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_my_pin(_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  IF _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be 6 digits';
  END IF;

  UPDATE public.staff_profiles
  SET pin_hash = crypt(_pin, gen_salt('bf')), updated_at = now()
  WHERE user_id = auth.uid();

  RETURN FOUND;
END;
$$;