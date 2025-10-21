-- Phase 1: Add missing "creator" role with proper hierarchy
-- First, ensure we have a unique constraint on roles.name for safety
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'roles_name_key'
  ) THEN
    ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
  END IF;
END $$;

-- Now insert the creator role
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
VALUES (
  'creator',
  'Creator',
  'Users who can create fundraisers and projects',
  50,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level;

-- Grant creator role to all authenticated users (open platform model)
-- This ensures existing users can create fundraisers immediately
DO $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Get the creator role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'creator';
  
  -- Grant to all users who don't have it
  INSERT INTO public.user_role_assignments (user_id, role_id, context_type, is_active)
  SELECT 
    u.id as user_id,
    v_role_id as role_id,
    'global' as context_type,
    true as is_active
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_role_assignments ura
    WHERE ura.user_id = u.id 
      AND ura.role_id = v_role_id
      AND ura.context_type = 'global'
  );
END $$;