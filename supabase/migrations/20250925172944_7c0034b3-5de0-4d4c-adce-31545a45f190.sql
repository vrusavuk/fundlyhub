-- Create security definer function to check for existing super admins
CREATE OR REPLACE FUNCTION public.has_existing_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE r.name = 'super_admin' 
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
$$;

-- Drop the existing bootstrap policy
DROP POLICY IF EXISTS "Bootstrap: Allow first super admin assignment" ON public.user_role_assignments;

-- Recreate the bootstrap policy using the security definer function
CREATE POLICY "Bootstrap: Allow first super admin assignment" 
ON public.user_role_assignments 
FOR INSERT 
WITH CHECK (
  -- Allow assignment of super admin role only when:
  -- 1. User is assigning to themselves
  -- 2. Role being assigned is super_admin 
  -- 3. No existing super admin exists in the system
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM roles 
    WHERE id = role_id 
    AND name = 'super_admin'
  )
  AND NOT public.has_existing_super_admin()
);