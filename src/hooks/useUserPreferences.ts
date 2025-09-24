/**
 * User preferences hook for persisting user settings and preferences
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  // Display preferences
  viewMode: 'grid' | 'list';
  theme: 'light' | 'dark' | 'system';
  
  // Search preferences
  recentSearches: string[];
  searchSuggestions: boolean;
  
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  
  // Accessibility preferences
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  lastVisited: string;
  
  // Feature preferences
  autoSave: boolean;
  defaultCategory: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  viewMode: 'grid',
  theme: 'system',
  recentSearches: [],
  searchSuggestions: true,
  emailNotifications: true,
  pushNotifications: false,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  hasCompletedOnboarding: false,
  lastVisited: new Date().toISOString(),
  autoSave: true,
  defaultCategory: 'All'
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save preferences to Supabase and localStorage
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      setPreferences(updatedPrefs);

      // Save to localStorage immediately for immediate feedback
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));

      // Sync with database if user is authenticated
      if (user) {
        const dbPrefs = {
          user_id: user.id,
          view_mode: updatedPrefs.viewMode,
          theme: updatedPrefs.theme,
          recent_searches: updatedPrefs.recentSearches,
          search_suggestions: updatedPrefs.searchSuggestions,
          email_notifications: updatedPrefs.emailNotifications,
          push_notifications: updatedPrefs.pushNotifications,
          reduced_motion: updatedPrefs.reducedMotion,
          high_contrast: updatedPrefs.highContrast,
          font_size: updatedPrefs.fontSize,
          has_completed_onboarding: updatedPrefs.hasCompletedOnboarding,
          has_skipped_onboarding: sessionStorage.getItem('onboardingSkipped') === 'true',
          last_visited: updatedPrefs.lastVisited,
          auto_save: updatedPrefs.autoSave,
          default_category: updatedPrefs.defaultCategory,
        };

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert(dbPrefs, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Failed to sync preferences with database:', upsertError);
          // Don't throw error - localStorage backup is still available
        }
      }
    } catch (err) {
      console.error('Failed to save user preferences:', err);
      setError('Failed to save preferences');
    }
  }, [preferences, user]);

  // Load preferences from Supabase and localStorage
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let finalPrefs = { ...DEFAULT_PREFERENCES };

      // Load from localStorage first as backup/cache
      const localPrefs = localStorage.getItem('userPreferences');
      if (localPrefs) {
        const parsed = JSON.parse(localPrefs);
        finalPrefs = { ...finalPrefs, ...parsed };
      }

      // Load from database if user is authenticated
      if (user) {
        const { data: dbPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to load preferences from database:', fetchError);
          // Continue with localStorage data
        } else if (dbPrefs) {
          // Map database fields to UserPreferences interface
          const mappedPrefs: UserPreferences = {
            viewMode: dbPrefs.view_mode as 'grid' | 'list',
            theme: dbPrefs.theme as 'light' | 'dark' | 'system',
            recentSearches: dbPrefs.recent_searches || [],
            searchSuggestions: dbPrefs.search_suggestions,
            emailNotifications: dbPrefs.email_notifications,
            pushNotifications: dbPrefs.push_notifications,
            reducedMotion: dbPrefs.reduced_motion,
            highContrast: dbPrefs.high_contrast,
            fontSize: dbPrefs.font_size as 'small' | 'medium' | 'large',
            hasCompletedOnboarding: dbPrefs.has_completed_onboarding,
            lastVisited: dbPrefs.last_visited,
            autoSave: dbPrefs.auto_save,
            defaultCategory: dbPrefs.default_category,
          };

          // Update sessionStorage for onboarding skip state
          if (dbPrefs.has_skipped_onboarding) {
            sessionStorage.setItem('onboardingSkipped', 'true');
          }

          finalPrefs = { ...finalPrefs, ...mappedPrefs };
          
          // Update localStorage cache
          localStorage.setItem('userPreferences', JSON.stringify(finalPrefs));
        }
      }

      setPreferences(finalPrefs);
    } catch (err) {
      console.error('Failed to load user preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Individual preference setters
  const setViewMode = useCallback((viewMode: 'grid' | 'list') => {
    savePreferences({ viewMode });
  }, [savePreferences]);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    savePreferences({ theme });
  }, [savePreferences]);

  const addRecentSearch = useCallback((search: string) => {
    const updatedSearches = [
      search,
      ...preferences.recentSearches.filter(s => s !== search)
    ].slice(0, 10); // Keep only last 10 searches
    
    savePreferences({ recentSearches: updatedSearches });
  }, [preferences.recentSearches, savePreferences]);

  const clearRecentSearches = useCallback(() => {
    savePreferences({ recentSearches: [] });
  }, [savePreferences]);

  const completeOnboarding = useCallback(() => {
    // Clear skip state when completing
    sessionStorage.removeItem('onboardingSkipped');
    savePreferences({ hasCompletedOnboarding: true });
  }, [savePreferences]);

  const skipOnboarding = useCallback(() => {
    // Set skip state in sessionStorage and database
    sessionStorage.setItem('onboardingSkipped', 'true');
    savePreferences({ hasCompletedOnboarding: false });
  }, [savePreferences]);

  const updateLastVisited = useCallback(() => {
    savePreferences({ lastVisited: new Date().toISOString() });
  }, [savePreferences]);

  // Load preferences on mount and auth change
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Apply theme preference
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [preferences.theme]);

  // Apply accessibility preferences
  useEffect(() => {
    const root = document.documentElement;
    
    if (preferences.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (preferences.fontSize === 'small') {
      root.classList.add('text-sm');
    } else if (preferences.fontSize === 'large') {
      root.classList.add('text-lg');
    } else {
      root.classList.add('text-base');
    }
  }, [preferences.reducedMotion, preferences.highContrast, preferences.fontSize]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    setViewMode,
    setTheme,
    addRecentSearch,
    clearRecentSearches,
    completeOnboarding,
    skipOnboarding,
    updateLastVisited,
    loadPreferences
  };
}