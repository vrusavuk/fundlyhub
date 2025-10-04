-- Fix the sync_user_role_from_activity trigger to handle different table schemas
CREATE OR REPLACE FUNCTION public.sync_user_role_from_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_fundraiser_count INTEGER;
  v_org_admin_count INTEGER;
  v_has_platform_role BOOLEAN;
  v_new_role user_role;
  v_old_role user_role;
BEGIN
  -- Determine user_id based on which table triggered this and what fields are available
  IF TG_TABLE_NAME = 'fundraisers' THEN
    v_user_id := COALESCE(NEW.owner_user_id, OLD.owner_user_id);
  ELSIF TG_TABLE_NAME = 'org_members' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSE
    -- Fallback for other tables - try both field names
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
  
  -- If we couldn't determine user_id, exit early
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get current role
  SELECT role INTO v_old_role FROM profiles WHERE id = v_user_id;
  
  -- Check if user has platform admin role in RBAC
  SELECT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN roles r ON ura.role_id = r.id
    WHERE ura.user_id = v_user_id
    AND r.name IN ('super_admin', 'platform_admin')
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ) INTO v_has_platform_role;
  
  -- Don't demote platform admins automatically
  IF v_has_platform_role AND v_old_role = 'admin' THEN
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
  IF v_has_platform_role THEN
    v_new_role := 'admin';
  ELSIF v_org_admin_count > 0 THEN
    v_new_role := 'org_admin';
  ELSIF v_fundraiser_count > 0 THEN
    v_new_role := 'creator';
  ELSE
    v_new_role := 'visitor';
  END IF;
  
  -- Update profile role if changed
  IF v_old_role != v_new_role THEN
    UPDATE profiles
    SET role = v_new_role,
        updated_at = now()
    WHERE id = v_user_id;
    
    -- Log the role change
    PERFORM log_audit_event(
      v_user_id,
      'role_auto_updated',
      'user_role',
      v_user_id,
      jsonb_build_object(
        'old_role', v_old_role,
        'new_role', v_new_role,
        'trigger_table', TG_TABLE_NAME,
        'trigger_operation', TG_OP,
        'reason', 'automatic_lifecycle_update',
        'fundraiser_count', v_fundraiser_count,
        'org_admin_count', v_org_admin_count,
        'has_platform_role', v_has_platform_role
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;