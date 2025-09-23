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

  // Save preferences to localStorage only (no Supabase table for now)
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      setPreferences(updatedPrefs);

      // Save to localStorage immediately
      localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));

      // Note: Supabase user_preferences table not yet implemented
      // In production, this would sync with the database
    } catch (err) {
      console.error('Failed to save user preferences:', err);
      setError('Failed to save preferences');
    }
  }, [preferences]);

  // Load preferences from localStorage only (no Supabase table for now)
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from localStorage
      const localPrefs = localStorage.getItem('userPreferences');
      if (localPrefs) {
        const parsed = JSON.parse(localPrefs);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }

      // Note: Supabase user_preferences table not yet implemented
      // In production, this would also load from the database
    } catch (err) {
      console.error('Failed to load user preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

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
    savePreferences({ hasCompletedOnboarding: true });
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
    updateLastVisited,
    loadPreferences
  };
}