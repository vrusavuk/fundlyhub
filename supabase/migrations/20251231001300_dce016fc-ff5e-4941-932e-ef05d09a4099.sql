-- Step 1: Backfill existing users who don't have RBAC entries
-- Map legacy profiles.role to RBAC roles:
-- 'visitor' -> visitor role (fc20a7fd-db3f-4c5a-9fa6-6ceefa226bff)
-- 'creator' -> creator role (351fdc1a-597c-44a8-870a-ae537d108ae6)
-- 'org_admin' -> org_admin role (4d0e6704-483e-4fe9-800d-2361f7577903)
-- 'admin' -> platform_admin role (ad9567df-1e4b-43fb-b997-e0a2ddfceb21)

INSERT INTO user_role_assignments (user_id, role_id, context_type, assigned_by, is_active)
SELECT 
  p.id as user_id,
  CASE 
    WHEN p.role = 'admin' THEN 'ad9567df-1e4b-43fb-b997-e0a2ddfceb21'::uuid
    WHEN p.role = 'org_admin' THEN '4d0e6704-483e-4fe9-800d-2361f7577903'::uuid
    WHEN p.role = 'creator' THEN '351fdc1a-597c-44a8-870a-ae537d108ae6'::uuid
    ELSE 'fc20a7fd-db3f-4c5a-9fa6-6ceefa226bff'::uuid -- default to visitor
  END as role_id,
  'global' as context_type,
  p.id as assigned_by,
  true as is_active
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_role_assignments ura 
  WHERE ura.user_id = p.id 
  AND ura.context_type = 'global'
  AND ura.is_active = true
)
AND p.deleted_at IS NULL;

-- Step 2: Create helper function to get user's display role from RBAC
CREATE OR REPLACE FUNCTION public.get_user_display_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM user_role_assignments ura
  JOIN roles r ON ura.role_id = r.id
  WHERE ura.user_id = _user_id
    AND ura.is_active = true
    AND ura.context_type = 'global'
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;
$$;

-- Step 3: Create function to get user's display role info (name and hierarchy)
CREATE OR REPLACE FUNCTION public.get_user_role_info(_user_id uuid)
RETURNS TABLE(role_name text, display_name text, hierarchy_level integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name, r.display_name, r.hierarchy_level
  FROM user_role_assignments ura
  JOIN roles r ON ura.role_id = r.id
  WHERE ura.user_id = _user_id
    AND ura.is_active = true
    AND ura.context_type = 'global'
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;
$$;

-- Step 4: Update handle_new_user to also create RBAC entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visitor_role_id uuid;
BEGIN
  -- Create profile (without setting role column - will be removed later)
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    'visitor'::public.user_role -- Keep for backward compat until column dropped
  );
  
  -- Get visitor role ID
  SELECT id INTO visitor_role_id FROM public.roles WHERE name = 'visitor';
  
  -- Create RBAC role assignment (the single source of truth)
  IF visitor_role_id IS NOT NULL THEN
    INSERT INTO public.user_role_assignments (user_id, role_id, context_type, assigned_by, is_active)
    VALUES (NEW.id, visitor_role_id, 'global', NEW.id, true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Update sync_user_role_from_activity to update RBAC instead of profiles.role
CREATE OR REPLACE FUNCTION public.sync_user_role_from_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_fundraiser_count INTEGER;
  v_org_admin_count INTEGER;
  v_has_platform_role BOOLEAN;
  v_new_role_name text;
  v_new_role_id uuid;
  v_current_role_name text;
  v_current_role_id uuid;
BEGIN
  -- Determine user_id based on which table triggered this
  IF TG_TABLE_NAME = 'fundraisers' THEN
    v_user_id := COALESCE(NEW.owner_user_id, OLD.owner_user_id);
  ELSIF TG_TABLE_NAME = 'org_members' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSE
    v_user_id := COALESCE(
      CASE WHEN TG_OP != 'DELETE' THEN 
        CASE 
          WHEN NEW.owner_user_id IS NOT NULL THEN NEW.owner_user_id
          WHEN NEW.user_id IS NOT NULL THEN NEW.user_id
          ELSE NULL
        END
      ELSE NULL
      END,
      CASE WHEN TG_OP != 'INSERT' THEN
        CASE 
          WHEN OLD.owner_user_id IS NOT NULL THEN OLD.owner_user_id
          WHEN OLD.user_id IS NOT NULL THEN OLD.user_id
          ELSE NULL
        END
      ELSE NULL
      END
    );
  END IF;
  
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get current RBAC role
  SELECT r.name, r.id INTO v_current_role_name, v_current_role_id
  FROM user_role_assignments ura
  JOIN roles r ON ura.role_id = r.id
  WHERE ura.user_id = v_user_id
    AND ura.context_type = 'global'
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ORDER BY r.hierarchy_level DESC
  LIMIT 1;
  
  -- Check if user has platform admin role
  SELECT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = v_user_id
    AND r.name IN ('super_admin', 'platform_admin')
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ) INTO v_has_platform_role;
  
  -- Don't demote platform admins
  IF v_has_platform_role THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Count active fundraisers
  SELECT COUNT(*) INTO v_fundraiser_count
  FROM fundraisers
  WHERE owner_user_id = v_user_id
  AND deleted_at IS NULL
  AND status IN ('active', 'pending', 'paused', 'draft');
  
  -- Count organization admin/owner roles
  SELECT COUNT(*) INTO v_org_admin_count
  FROM org_members
  WHERE user_id = v_user_id
  AND role IN ('owner', 'admin');
  
  -- Determine appropriate role based on activity
  IF v_org_admin_count > 0 THEN
    v_new_role_name := 'org_admin';
  ELSIF v_fundraiser_count > 0 THEN
    v_new_role_name := 'creator';
  ELSE
    v_new_role_name := 'visitor';
  END IF;
  
  -- Get the new role ID
  SELECT id INTO v_new_role_id FROM roles WHERE name = v_new_role_name;
  
  -- Update RBAC role if changed
  IF v_current_role_name IS DISTINCT FROM v_new_role_name AND v_new_role_id IS NOT NULL THEN
    -- Deactivate old global role assignment
    UPDATE user_role_assignments
    SET is_active = false
    WHERE user_id = v_user_id
      AND context_type = 'global'
      AND is_active = true
      AND role_id = v_current_role_id;
    
    -- Insert new role assignment
    INSERT INTO user_role_assignments (user_id, role_id, context_type, assigned_by, is_active)
    VALUES (v_user_id, v_new_role_id, 'global', v_user_id, true)
    ON CONFLICT DO NOTHING;
    
    -- Also update profiles.role for backward compatibility (until column is removed)
    UPDATE profiles
    SET role = v_new_role_name::user_role,
        updated_at = now()
    WHERE id = v_user_id
    AND role::text != v_new_role_name;
    
    -- Log the role change
    PERFORM log_audit_event(
      v_user_id,
      'role_auto_updated',
      'user_role',
      v_user_id,
      jsonb_build_object(
        'old_role', v_current_role_name,
        'new_role', v_new_role_name,
        'trigger_table', TG_TABLE_NAME,
        'trigger_operation', TG_OP,
        'reason', 'automatic_lifecycle_update',
        'fundraiser_count', v_fundraiser_count,
        'org_admin_count', v_org_admin_count
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;