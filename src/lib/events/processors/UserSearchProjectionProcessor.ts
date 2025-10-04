/**
 * User Search Projection Processor
 * Updates user_search_projection table when user profiles change
 * 
 * Following SOLID principles:
 * - Single Responsibility: Only manages user search projections
 * - Open/Closed: Can be extended without modification
 * - Dependency Inversion: Depends on event abstractions
 */

import type { EventHandler } from '../types';
import type { UserEvent } from '../domain/UserEvents';
import { supabase } from '@/integrations/supabase/client';

export class UserSearchProjectionProcessor implements EventHandler<UserEvent> {
  readonly eventType = 'user.*'; // Listen to all user events

  async handle(event: UserEvent): Promise<void> {
    console.log('[UserSearchProjectionProcessor] Processing event:', event.type);

    try {
      switch (event.type) {
        case 'user.registered':
          await this.handleUserRegistered(event as any);
          break;
        case 'user.profile_updated':
          await this.handleProfileUpdated(event as any);
          break;
        default:
          // Ignore other user events
          break;
      }
    } catch (error) {
      console.error('[UserSearchProjectionProcessor] Failed to process event:', error);
      throw error; // Re-throw for dead letter queue handling
    }
  }

  /**
   * Handle new user registration - add to search projection
   */
  private async handleUserRegistered(event: any): Promise<void> {
    const { userId, email, name } = event.payload;

    // Fetch full profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .eq('profile_visibility', 'public')
      .eq('account_status', 'active')
      .maybeSingle();

    if (error || !profile) {
      console.warn('[UserSearchProjectionProcessor] Profile not found or not public:', userId);
      return;
    }

    // Insert into search projection with pre-computed fields
    await this.upsertSearchProjection(profile);
  }

  /**
   * Handle profile updates - update search projection
   */
  private async handleProfileUpdated(event: any): Promise<void> {
    const { userId } = event.payload;

    // Fetch updated profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      console.warn('[UserSearchProjectionProcessor] Profile not found:', userId);
      return;
    }

    // Only include in search if public and active
    if (profile.profile_visibility === 'public' && profile.account_status === 'active') {
      await this.upsertSearchProjection(profile);
    } else {
      // Remove from search if no longer public/active
      await this.deleteSearchProjection(userId);
    }
  }


  /**
   * Upsert search projection with pre-computed fields
   */
  private async upsertSearchProjection(profile: any): Promise<void> {
    const nameLower = (profile.name || '').toLowerCase();
    const nameTokens = (profile.name || '').toLowerCase().split(/\s+/);
    
    // Generate bigrams
    const bigrams: string[] = [];
    for (let i = 0; i < nameLower.length - 1; i++) {
      bigrams.push(nameLower.substring(i, i + 2));
    }
    
    // Generate trigrams
    const trigrams: string[] = [];
    for (let i = 0; i < nameLower.length - 2; i++) {
      trigrams.push(nameLower.substring(i, i + 3));
    }

    const projectionData = {
      user_id: profile.id,
      name: profile.name || '',
      email: profile.email,
      avatar: profile.avatar,
      bio: profile.bio,
      location: profile.location,
      
      // Pre-computed fields
      name_lowercase: nameLower,
      name_tokens: nameTokens,
      name_bigrams: bigrams,
      name_trigrams: trigrams,
      
      // These will be computed by database triggers/functions
      // but we set them to null to let the DB handle it
      search_vector: null,
      name_soundex: null,
      name_metaphone: null,
      name_dmetaphone: null,
      
      // Metadata
      role: profile.role,
      profile_visibility: profile.profile_visibility,
      account_status: profile.account_status,
      is_verified: profile.is_verified || false,
      
      // Stats
      follower_count: profile.follower_count || 0,
      campaign_count: profile.campaign_count || 0,
      relevance_boost: this.calculateRelevanceBoost(profile),
      
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_search_projection')
      .upsert(projectionData, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[UserSearchProjectionProcessor] Failed to upsert projection:', error);
      throw error;
    }

    console.log('[UserSearchProjectionProcessor] Updated search projection for user:', profile.id);
  }

  /**
   * Delete search projection
   */
  private async deleteSearchProjection(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_search_projection')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[UserSearchProjectionProcessor] Failed to delete projection:', error);
      throw error;
    }

    console.log('[UserSearchProjectionProcessor] Deleted search projection for user:', userId);
  }

  /**
   * Calculate relevance boost based on profile quality
   */
  private calculateRelevanceBoost(profile: any): number {
    let boost = 1.0;
    
    // Verified users get higher boost
    if (profile.is_verified) boost += 0.3;
    
    // Users with campaigns get boost
    if (profile.campaign_count > 0) boost += 0.2;
    
    // Popular users get boost
    if (profile.follower_count > 100) boost += 0.2;
    else if (profile.follower_count > 50) boost += 0.1;
    
    // Complete profiles get boost
    if (profile.bio && profile.location) boost += 0.1;
    
    return Math.min(boost, 2.0); // Cap at 2x
  }
}
