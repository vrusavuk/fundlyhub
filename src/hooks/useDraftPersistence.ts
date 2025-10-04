/**
 * Draft Persistence Hook
 * Auto-saves fundraiser drafts to localStorage
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fundraiserMutationService } from '@/lib/services/fundraiserMutation.service';
import { CompleteFundraiser } from '@/lib/validation/fundraiserCreation.schema';

interface UseDraftPersistenceOptions {
  formData: Partial<CompleteFundraiser>;
  autoSaveInterval?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useDraftPersistence({
  formData,
  autoSaveInterval = 30000,
  enabled = true,
}: UseDraftPersistenceOptions) {
  const { user } = useAuth();

  const saveDraft = useCallback(() => {
    if (!user || !enabled) return;
    
    // Only save if there's actual data
    if (Object.keys(formData).length === 0) return;
    
    fundraiserMutationService.saveDraftToLocal(user.id, formData);
  }, [user, formData, enabled]);

  const loadDraft = useCallback((): Partial<CompleteFundraiser> | null => {
    if (!user || !enabled) return null;
    return fundraiserMutationService.loadDraftFromLocal(user.id);
  }, [user, enabled]);

  const clearDraft = useCallback(() => {
    if (!user) return;
    fundraiserMutationService.clearDraftFromLocal(user.id);
  }, [user]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(saveDraft, autoSaveInterval);
    return () => clearInterval(intervalId);
  }, [saveDraft, autoSaveInterval, enabled]);

  // Save on blur/unfocus
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => saveDraft();
    window.addEventListener('blur', handleBlur);
    
    return () => window.removeEventListener('blur', handleBlur);
  }, [saveDraft, enabled]);

  // Save before unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => saveDraft();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft, enabled]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
  };
}
