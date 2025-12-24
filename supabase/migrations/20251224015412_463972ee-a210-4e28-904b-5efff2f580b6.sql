-- Ensure users can persist their auth (Google) avatar into public.profiles.avatar securely
-- This keeps avatar as single source of truth for public profile + campaign cards.

CREATE OR REPLACE FUNCTION public.set_my_profile_avatar(p_avatar_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Basic validation: require http(s) and reasonable length
  IF p_avatar_url IS NULL OR length(p_avatar_url) < 8 OR length(p_avatar_url) > 2048 THEN
    RAISE EXCEPTION 'Invalid avatar URL';
  END IF;

  IF p_avatar_url !~* '^https?://.+' THEN
    RAISE EXCEPTION 'Avatar URL must be http(s)';
  END IF;

  UPDATE public.profiles
  SET avatar = p_avatar_url
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_profile_avatar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_profile_avatar(text) TO authenticated;