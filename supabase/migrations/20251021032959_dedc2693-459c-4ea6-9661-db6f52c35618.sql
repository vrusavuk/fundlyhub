-- Find and drop ALL triggers on user_role_assignments that call sync_user_role_from_activity

DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  -- Drop all triggers on user_role_assignments
  FOR trigger_record IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'public.user_role_assignments'::regclass
    AND tgname NOT LIKE 'RI_%'  -- Don't drop system triggers
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.user_role_assignments', trigger_record.tgname);
    RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
  END LOOP;
END $$;

-- Now grant super admin to virusavuk@gmail.com
DO $$
DECLARE
  v_user_id UUID;
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'virusavuk@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email virusavuk@gmail.com not found';
  END IF;
  
  INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role)
  VALUES ('super_admin', 'Super Administrator', 'Full system access', 1000, true)
  ON CONFLICT (name) DO UPDATE SET hierarchy_level = 1000
  RETURNING id INTO v_role_id;
  
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'super_admin';
  END IF;
  
  INSERT INTO public.permissions (name, display_name, description, category)
  VALUES ('super_admin_access', 'Super Admin Access', 'Full system access', 'system')
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_permission_id;
  
  IF v_permission_id IS NULL THEN
    SELECT id INTO v_permission_id FROM public.permissions WHERE name = 'super_admin_access';
  END IF;
  
  INSERT INTO public.role_permissions (role_id, permission_id)
  VALUES (v_role_id, v_permission_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- Direct insert without checking (simpler)
  INSERT INTO public.user_role_assignments (user_id, role_id, context_type, is_active, assigned_by)
  VALUES (v_user_id, v_role_id, 'global', true, v_user_id)
  ON CONFLICT DO NOTHING;
  
  PERFORM log_audit_event(
    v_user_id,
    'super_admin_role_granted',
    'user_role',
    v_user_id,
    jsonb_build_object('role', 'super_admin', 'email', 'virusavuk@gmail.com')
  );
  
  RAISE NOTICE 'Super admin granted to %', v_user_id;
END $$;