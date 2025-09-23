/**
 * Onboarding demo provider for managing demo data and tour interactions
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface DemoSearchResult {
  id: string;
  type: 'campaign' | 'user' | 'organization';
  title: string;
  description: string;
  link: string;
  metadata?: Record<string, any>;
}

export interface DemoSearchSuggestion {
  text: string;
  category?: 'campaign' | 'user' | 'organization';
  type: 'suggestion' | 'recent' | 'trending';
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

export function useOnboardingDemo() {
  const context = useContext(OnboardingDemoContext);
  if (!context) {
    throw new Error('useOnboardingDemo must be used within OnboardingDemoProvider');
  }
  return context;
}

// Demo data for realistic search interactions
const DEMO_CAMPAIGNS: DemoSearchResult[] = [
  {
    id: 'demo-1',
    type: 'campaign',
    title: 'Building Schools in Rural Kenya',
    description: 'Help us build educational facilities for underserved communities',
    link: '/campaigns/demo-education-kenya',
    metadata: { raised: '$45,230', goal: '$75,000', category: 'education' }
  },
  {
    id: 'demo-2',
    type: 'campaign',
    title: 'Medical Equipment for Children\'s Hospital',
    description: 'Funding critical medical equipment for pediatric care',
    link: '/campaigns/demo-medical-equipment',
    metadata: { raised: '$22,850', goal: '$50,000', category: 'medical' }
  },
  {
    id: 'demo-3',
    type: 'campaign',
    title: 'Clean Water Initiative - Guatemala',
    description: 'Bringing clean drinking water to remote villages',
    link: '/campaigns/demo-water-guatemala',
    metadata: { raised: '$67,420', goal: '$80,000', category: 'emergency' }
  }
];

const DEMO_USERS: DemoSearchResult[] = [
  {
    id: 'demo-user-1',
    type: 'user',
    title: 'Sarah Johnson',
    description: 'Education advocate and community organizer',
    link: '/profile/demo-sarah-johnson',
    metadata: { campaigns: 3, raised: '$125,000' }
  },
  {
    id: 'demo-user-2',
    type: 'user',
    title: 'Dr. Michael Chen',
    description: 'Medical professional supporting healthcare initiatives',
    link: '/profile/demo-michael-chen',
    metadata: { campaigns: 2, raised: '$89,500' }
  }
];

const DEMO_ORGANIZATIONS: DemoSearchResult[] = [
  {
    id: 'demo-org-1',
    type: 'organization',
    title: 'Global Education Foundation',
    description: 'Nonprofit focused on educational access worldwide',
    link: '/organization/demo-education-foundation',
    metadata: { campaigns: 12, raised: '$1,250,000' }
  }
];

const DEMO_SUGGESTIONS: DemoSearchSuggestion[] = [
  { text: 'education', category: 'campaign', type: 'trending' },
  { text: 'medical emergency', category: 'campaign', type: 'trending' },
  { text: 'clean water', category: 'campaign', type: 'suggestion' },
  { text: 'children\'s health', category: 'campaign', type: 'suggestion' },
  { text: 'disaster relief', category: 'campaign', type: 'recent' },
  { text: 'community building', category: 'campaign', type: 'recent' }
];

interface OnboardingDemoProviderProps {
  children: React.ReactNode;
}

export function OnboardingDemoProvider({ children }: OnboardingDemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoInteractions, setDemoInteractions] = useState<Array<{ action: string; data?: any; timestamp: number }>>([]);

  const trackDemoInteraction = useCallback((action: string, data?: any) => {
    if (!isDemoMode) return;

    const interaction = {
      action,
      data,
      timestamp: Date.now()
    };

    setDemoInteractions(prev => [...prev, interaction]);
    
    // Optional: Log to console for debugging
    console.log('[Demo Interaction]', interaction);
  }, [isDemoMode]);

  const setDemoMode = useCallback((enabled: boolean) => {
    setIsDemoMode(enabled);
    if (enabled) {
      trackDemoInteraction('demo_mode_enabled');
    } else {
      trackDemoInteraction('demo_mode_disabled');
    }
  }, [trackDemoInteraction]);

  const getDemoSearchResults = useCallback((query: string): DemoSearchResult[] => {
    if (!isDemoMode || !query) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: DemoSearchResult[] = [];

    // Search in campaigns
    const matchingCampaigns = DEMO_CAMPAIGNS.filter(campaign => 
      campaign.title.toLowerCase().includes(normalizedQuery) ||
      campaign.description.toLowerCase().includes(normalizedQuery) ||
      campaign.metadata?.category?.toLowerCase().includes(normalizedQuery)
    );

    // Search in users
    const matchingUsers = DEMO_USERS.filter(user =>
      user.title.toLowerCase().includes(normalizedQuery) ||
      user.description.toLowerCase().includes(normalizedQuery)
    );

    // Search in organizations
    const matchingOrganizations = DEMO_ORGANIZATIONS.filter(org =>
      org.title.toLowerCase().includes(normalizedQuery) ||
      org.description.toLowerCase().includes(normalizedQuery)
    );

    // Combine results with campaigns first
    results.push(...matchingCampaigns, ...matchingUsers, ...matchingOrganizations);

    // If no specific matches, return some default results for demo purposes
    if (results.length === 0 && normalizedQuery.length > 0) {
      return DEMO_CAMPAIGNS.slice(0, 2);
    }

    return results.slice(0, 6); // Limit to 6 results
  }, [isDemoMode]);

  const getDemoSearchSuggestions = useCallback((query: string): DemoSearchSuggestion[] => {
    if (!isDemoMode) return [];

    if (!query || query.length === 0) {
      // Return trending and recent suggestions when no query
      return DEMO_SUGGESTIONS.filter(s => s.type === 'trending' || s.type === 'recent').slice(0, 6);
    }

    const normalizedQuery = query.toLowerCase();
    const matchingSuggestions = DEMO_SUGGESTIONS.filter(suggestion =>
      suggestion.text.toLowerCase().includes(normalizedQuery)
    );

    return matchingSuggestions.slice(0, 4);
  }, [isDemoMode]);

  const simulateSearchInteraction = useCallback((query: string) => {
    if (!isDemoMode) return;

    trackDemoInteraction('search_simulation', { query });
    
    // Simulate typing delay for realistic demo
    setTimeout(() => {
      trackDemoInteraction('search_results_shown', { 
        query, 
        resultCount: getDemoSearchResults(query).length 
      });
    }, 300);
  }, [isDemoMode, getDemoSearchResults, trackDemoInteraction]);

  const value: OnboardingDemoContextType = {
    isDemoMode,
    setDemoMode,
    getDemoSearchResults,
    getDemoSearchSuggestions,
    simulateSearchInteraction,
    trackDemoInteraction,
    demoInteractions
  };

  return (
    <OnboardingDemoContext.Provider value={value}>
      {children}
    </OnboardingDemoContext.Provider>
  );
}