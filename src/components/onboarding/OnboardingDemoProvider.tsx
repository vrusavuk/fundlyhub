/**
 * Onboarding Demo Provider with enhanced error handling
 * Provides demo functionality for onboarding tours with fallback support
 */
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

// Demo data interfaces
interface DemoUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  organization?: string;
}

interface DemoSearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  type: 'campaign' | 'user' | 'organization';
}

interface DemoSearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
  category?: string;
}

interface OnboardingDemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  getDemoSearchResults: (query: string) => DemoSearchResult[];
  getDemoSearchSuggestions: (query: string) => DemoSearchSuggestion[];
  simulateSearchInteraction: (query: string) => void;
  trackDemoInteraction: (action: string, data?: any) => void;
  demoInteractions: Array<{ action: string; data?: any; timestamp: number }>;
}

const OnboardingDemoContext = createContext<OnboardingDemoContextType | undefined>(undefined);

// Safe hook with fallback
export function useOnboardingDemo(): OnboardingDemoContextType {
  const context = useContext(OnboardingDemoContext);
  
  // Always return a valid object, never throw
  if (!context) {
    return {
      isDemoMode: false,
      setDemoMode: () => {},
      getDemoSearchResults: () => [],
      getDemoSearchSuggestions: () => [],
      simulateSearchInteraction: () => {},
      trackDemoInteraction: () => {},
      demoInteractions: []
    };
  }
  
  return context;
}

// Demo data for realistic search interactions
const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    avatar: '/placeholder.svg',
    organization: 'Children\'s Art Foundation'
  },
  {
    id: 'demo-user-2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    avatar: '/placeholder.svg',
    organization: 'Community Health Initiative'
  }
];

const DEMO_SEARCH_RESULTS: DemoSearchResult[] = [
  {
    id: 'demo-campaign-1',
    title: 'Art Therapy for Children',
    description: 'Supporting creative healing through art therapy programs for children facing trauma.',
    category: 'Education',
    imageUrl: '/src/assets/categories/education.jpg',
    type: 'campaign'
  },
  {
    id: 'demo-campaign-2',
    title: 'Community Garden Project',
    description: 'Building sustainable community gardens in urban neighborhoods.',
    category: 'Environment',
    imageUrl: '/src/assets/categories/education.jpg',
    type: 'campaign'
  },
  {
    id: 'demo-org-1',
    title: 'Local Arts Foundation',
    description: 'Promoting arts education and creativity in local communities.',
    category: 'Arts',
    imageUrl: '/placeholder.svg',
    type: 'organization'
  }
];

const DEMO_SUGGESTIONS: DemoSearchSuggestion[] = [
  { id: 'demo-sug-1', text: 'art therapy', type: 'trending', category: 'education' },
  { id: 'demo-sug-2', text: 'community health', type: 'trending', category: 'medical' },
  { id: 'demo-sug-3', text: 'education support', type: 'suggestion', category: 'education' },
  { id: 'demo-sug-4', text: 'environmental projects', type: 'recent', category: 'environment' }
];

interface OnboardingDemoProviderProps {
  children: ReactNode;
}

export function OnboardingDemoProvider({ children }: OnboardingDemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoInteractions, setDemoInteractions] = useState<Array<{ action: string; data?: any; timestamp: number }>>([]);

  const getDemoSearchResults = useCallback((query: string): DemoSearchResult[] => {
    if (!query.trim()) return DEMO_SEARCH_RESULTS.slice(0, 3);
    
    const lowercaseQuery = query.toLowerCase();
    return DEMO_SEARCH_RESULTS.filter(result =>
      result.title.toLowerCase().includes(lowercaseQuery) ||
      result.description.toLowerCase().includes(lowercaseQuery) ||
      result.category.toLowerCase().includes(lowercaseQuery)
    );
  }, []);

  const getDemoSearchSuggestions = useCallback((query: string): DemoSearchSuggestion[] => {
    if (!query.trim()) return DEMO_SUGGESTIONS.slice(0, 4);
    
    const lowercaseQuery = query.toLowerCase();
    return DEMO_SUGGESTIONS.filter(suggestion =>
      suggestion.text.toLowerCase().includes(lowercaseQuery)
    );
  }, []);

  const trackDemoInteraction = useCallback((action: string, data?: any) => {
    if (!isDemoMode) return;

    const interaction = {
      action,
      data,
      timestamp: Date.now()
    };

    setDemoInteractions(prev => [...prev, interaction]);
  }, [isDemoMode]);

  const setDemoMode = useCallback((enabled: boolean) => {
    setIsDemoMode(enabled);
    if (enabled) {
      setDemoInteractions(prev => [...prev, { action: 'demo_mode_enabled', timestamp: Date.now() }]);
    } else {
      setDemoInteractions(prev => [...prev, { action: 'demo_mode_disabled', timestamp: Date.now() }]);
    }
  }, []);

  const simulateSearchInteraction = useCallback((query: string) => {
    if (!isDemoMode) return;
    
    // Simulate a realistic search interaction
    const timestamp = Date.now();
    setDemoInteractions(prev => [
      ...prev,
      { action: 'search_performed', data: { query, timestamp }, timestamp },
    ]);
    
    // Simulate some results being found
    const results = getDemoSearchResults(query);
    setDemoInteractions(prev => [
      ...prev,
      { 
        action: 'search_results_displayed', 
        data: { query, resultCount: results.length, timestamp }, 
        timestamp 
      }
    ]);
  }, [isDemoMode, getDemoSearchResults]);

  const value: OnboardingDemoContextType = useMemo(() => ({
    isDemoMode,
    setDemoMode,
    getDemoSearchResults,
    getDemoSearchSuggestions,
    simulateSearchInteraction,
    trackDemoInteraction,
    demoInteractions
  }), [
    isDemoMode,
    setDemoMode,
    getDemoSearchResults,
    getDemoSearchSuggestions,
    simulateSearchInteraction,
    trackDemoInteraction,
    demoInteractions
  ]);

  return (
    <OnboardingDemoContext.Provider value={value}>
      {children}
    </OnboardingDemoContext.Provider>
  );
}