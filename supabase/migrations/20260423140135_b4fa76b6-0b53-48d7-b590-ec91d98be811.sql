CREATE OR REPLACE FUNCTION public.verify_pos_admin_pin(_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  IF _pin !~ '^[0-9]{6}$' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    JOIN public.user_roles ur ON ur.user_id = sp.user_id
    WHERE ur.role = 'admin'::public.app_role
      AND sp.pin_hash IS NOT NULL
      AND sp.pin_hash = crypt(_pin, sp.pin_hash)
  );
END;
$$;