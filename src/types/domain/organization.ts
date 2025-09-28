/**
 * Organization domain types
 */
import type { BaseEntity } from './fundraiser';

export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  location?: string;
  verified: boolean;
  type: 'nonprofit' | 'charity' | 'foundation' | 'community';
}