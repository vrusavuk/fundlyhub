-- Add bootstrap policy to allow first super admin assignment
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
  AND NOT EXISTS (
    SELECT 1 
    FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE r.name = 'super_admin' 
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  )
);