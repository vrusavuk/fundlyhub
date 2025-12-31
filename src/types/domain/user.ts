/**
 * User domain types
 * 
 * NOTE: User roles are now managed exclusively through the RBAC system
 * (user_role_assignments + roles tables). The role property on profiles
 * is for display purposes only and is populated from RBAC.
 * 
 * For authorization checks, always use the useRBAC hook.
 */
import type { BaseEntity } from './fundraiser';

// Legacy profile interface for backward compatibility
export interface Profile {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string; // RBAC role name (display only, not for authorization)
}

// Enhanced user profile
export interface UserProfile extends BaseEntity {
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  verified: boolean;
  role?: string; // RBAC role name (display only, not for authorization)
}