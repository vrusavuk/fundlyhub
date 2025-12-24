/**
 * User domain types
 */
import type { BaseEntity } from './fundraiser';

// Legacy profile interface for backward compatibility
export interface Profile {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'visitor' | 'user' | 'admin';
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
  role?: 'visitor' | 'user' | 'admin';
}