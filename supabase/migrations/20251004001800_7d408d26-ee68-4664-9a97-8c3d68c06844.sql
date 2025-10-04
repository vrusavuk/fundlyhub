-- Add comment to profiles.role indicating display-only nature
COMMENT ON COLUMN profiles.role IS 
'DISPLAY ONLY - Do not use for permission checks. Use user_role_assignments and user_has_permission() function for all authorization decisions. This field is automatically synchronized based on user activity.';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role IS NOT NULL;

-- Create function to sync user roles based on activity
CREATE OR REPLACE FUNCTION public.sync_user_role_from_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_fundraiser_count INTEGER;
  v_org_admin_count INTEGER;
  v_has_platform_role BOOLEAN;
  v_new_role user_role;
  v_old_role user_role;
BEGIN
  -- Determine user_id based on which table triggered this
  v_user_id := COALESCE(NEW.owner_user_id, NEW.user_id, OLD.owner_user_id, OLD.user_id);
  
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
$$;

-- Create triggers for automatic role updates
DROP TRIGGER IF EXISTS update_user_role_on_fundraiser_change ON fundraisers;
CREATE TRIGGER update_user_role_on_fundraiser_change
AFTER INSERT OR UPDATE OR DELETE ON fundraisers
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_from_activity();

DROP TRIGGER IF EXISTS update_user_role_on_org_membership_change ON org_members;
CREATE TRIGGER update_user_role_on_org_membership_change
AFTER INSERT OR UPDATE OR DELETE ON org_members
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_from_activity();

DROP TRIGGER IF EXISTS update_user_role_on_rbac_change ON user_role_assignments;
CREATE TRIGGER update_user_role_on_rbac_change
AFTER INSERT OR UPDATE OR DELETE ON user_role_assignments
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_from_activity();

-- Migrate existing users to correct roles based on their current activity
DO $$
DECLARE
  user_record RECORD;
  v_fundraiser_count INTEGER;
  v_org_admin_count INTEGER;
  v_has_platform_role BOOLEAN;
  v_new_role user_role;
  v_updated_count INTEGER := 0;
BEGIN
  FOR user_record IN SELECT id, role FROM profiles LOOP
    -- Count fundraisers
    SELECT COUNT(*) INTO v_fundraiser_count
    FROM fundraisers
    WHERE owner_user_id = user_record.id
    AND deleted_at IS NULL
    AND status IN ('active', 'pending', 'paused', 'draft');
    
    -- Count org admin roles
    SELECT COUNT(*) INTO v_org_admin_count
    FROM org_members
    WHERE user_id = user_record.id
    AND role IN ('owner', 'admin');
    
    -- Check platform role
    SELECT EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN roles r ON ura.role_id = r.id
      WHERE ura.user_id = user_record.id
      AND r.name IN ('super_admin', 'platform_admin')
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
    ) INTO v_has_platform_role;
    
    -- Determine role
    IF v_has_platform_role THEN
      v_new_role := 'admin';
    ELSIF v_org_admin_count > 0 THEN
      v_new_role := 'org_admin';
    ELSIF v_fundraiser_count > 0 THEN
      v_new_role := 'creator';
    ELSE
      v_new_role := 'visitor';
    END IF;
    
    -- Update if needed
    IF user_record.role != v_new_role THEN
      UPDATE profiles 
      SET role = v_new_role, 
          updated_at = now()
      WHERE id = user_record.id;
      
      v_updated_count := v_updated_count + 1;
      
      -- Log migration
      PERFORM log_audit_event(
        user_record.id,
        'role_migrated',
        'user_role',
        user_record.id,
        jsonb_build_object(
          'old_role', user_record.role,
          'new_role', v_new_role,
          'reason', 'lifecycle_migration',
          'fundraiser_count', v_fundraiser_count,
          'org_admin_count', v_org_admin_count,
          'has_platform_role', v_has_platform_role
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: Updated % user roles', v_updated_count;
END $$;