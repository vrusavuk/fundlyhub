-- Fix security warning: Set search_path on gen_base62_token function
DROP FUNCTION IF EXISTS public.gen_base62_token(int);

CREATE OR REPLACE FUNCTION public.gen_base62_token(len int DEFAULT 22)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  out text := '';
  i int := 1;
BEGIN
  WHILE i <= len LOOP
    out := out || substr(chars, 1 + floor(random()*62)::int, 1);
    i := i + 1;
  END LOOP;
  RETURN out;
END; $$;