/**
 * Search suggestions and recent searches service
 * Manages search history, suggestions, and trending searches
 */

const RECENT_SEARCHES_KEY = 'fundlyhub_recent_searches';
const MAX_RECENT_SEARCHES = 10;
const STORAGE_EXPIRY_DAYS = 30;

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'trending';
  category?: 'campaign' | 'user' | 'organization';
  count?: number;
  timestamp?: number;
}

export interface PopularSearch {
  text: string;
  count: number;
  category?: string;
}

/**
 * Service for managing search suggestions and history
 */
export class SearchSuggestionsService {
  private static instance: SearchSuggestionsService;
  private recentSearches: SearchSuggestion[] = [];
  private popularSearches: PopularSearch[] = [];

  private constructor() {
    this.loadRecentSearches();
    this.initializePopularSearches();
  }

  static getInstance(): SearchSuggestionsService {
    if (!SearchSuggestionsService.instance) {
      SearchSuggestionsService.instance = new SearchSuggestionsService();
    }
    return SearchSuggestionsService.instance;
  }

  /**
   * Initialize popular/trending searches
   */
  private initializePopularSearches() {
    this.popularSearches = [
      { text: 'medical emergency', count: 1250, category: 'medical' },
      { text: 'education fund', count: 890, category: 'education' },
      { text: 'animal rescue', count: 750, category: 'animal' },
      { text: 'disaster relief', count: 680, category: 'emergency' },
      { text: 'community support', count: 540, category: 'community' },
      { text: 'cancer treatment', count: 490, category: 'medical' },
      { text: 'school supplies', count: 380, category: 'education' },
      { text: 'homeless shelter', count: 320, category: 'community' },
    ];
  }

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches() {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        const expiryTime = STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        // Filter out expired searches
        this.recentSearches = data.filter((search: SearchSuggestion) => {
          return search.timestamp && (now - search.timestamp) < expiryTime;
        });
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      this.recentSearches = [];
    }
  }

  /**
   * Save recent searches to localStorage
   */
  private saveRecentSearches() {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.warn('Failed to save recent searches:', error);
    }
  }

  /**
   * Add a search to recent searches
   */
  addRecentSearch(query: string, category?: 'campaign' | 'user' | 'organization') {
    if (!query.trim() || query.length < 2) return;

    const normalizedQuery = query.trim().toLowerCase();
    
    // Remove existing entry if it exists
    this.recentSearches = this.recentSearches.filter(
      search => search.text.toLowerCase() !== normalizedQuery
    );

    // Add new entry at the beginning
    const newSearch: SearchSuggestion = {
      id: `recent-${Date.now()}`,
      text: query.trim(),
      type: 'recent',
      category,
      timestamp: Date.now()
    };

    this.recentSearches.unshift(newSearch);

    // Keep only the most recent searches
    if (this.recentSearches.length > MAX_RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }

    this.saveRecentSearches();
  }

  /**
   * Get recent searches
   */
  getRecentSearches(limit = 5): SearchSuggestion[] {
    return this.recentSearches.slice(0, limit);
  }

  /**
   * Clear all recent searches
   */
  clearRecentSearches() {
    this.recentSearches = [];
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }

  /**
   * Get search suggestions based on input
   */
  getSuggestions(query: string, limit = 8): SearchSuggestion[] {
    if (!query.trim() || query.length < 1) {
      // Return recent searches and trending when no query
      const recent = this.getRecentSearches(3);
      const trending = this.getTrendingSearches(5);
      return [...recent, ...trending].slice(0, limit);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Add matching recent searches
    const matchingRecent = this.recentSearches.filter(search =>
      search.text.toLowerCase().includes(normalizedQuery)
    ).slice(0, 3);

    suggestions.push(...matchingRecent);

    // Add matching popular searches
    const matchingPopular = this.popularSearches
      .filter(search => search.text.toLowerCase().includes(normalizedQuery))
      .map((search, index) => ({
        id: `suggestion-${index}`,
        text: search.text,
        type: 'suggestion' as const,
        category: search.category as any,
        count: search.count
      }))
      .slice(0, 5);

    suggestions.push(...matchingPopular);

    // Generate auto-complete suggestions
    if (suggestions.length < limit) {
      const autoComplete = this.generateAutoComplete(normalizedQuery, limit - suggestions.length);
      suggestions.push(...autoComplete);
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, arr) =>
      arr.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase()) === index
    );

    return uniqueSuggestions.slice(0, limit);
  }

  /**
   * Get trending searches
   */
  getTrendingSearches(limit = 5): SearchSuggestion[] {
    return this.popularSearches
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((search, index) => ({
        id: `trending-${index}`,
        text: search.text,
        type: 'trending' as const,
        category: search.category as any,
        count: search.count
      }));
  }

  /**
   * Generate auto-complete suggestions
   */
  private generateAutoComplete(query: string, limit: number): SearchSuggestion[] {
    const commonTerms = [
      'help', 'support', 'fund', 'donate', 'charity', 'cause', 'emergency',
      'medical', 'education', 'community', 'family', 'children', 'animal',
      'disaster', 'relief', 'treatment', 'surgery', 'school', 'college'
    ];

    const suggestions: SearchSuggestion[] = [];
    
    for (const term of commonTerms) {
      if (suggestions.length >= limit) break;
      
      if (term.startsWith(query) && term !== query) {
        suggestions.push({
          id: `autocomplete-${term}`,
          text: term,
          type: 'suggestion'
        });
      }
    }

    return suggestions;
  }

  /**
   * Get category-specific suggestions
   */
  getCategorySuggestions(category: string, limit = 5): SearchSuggestion[] {
    const categoryTerms: Record<string, string[]> = {
      medical: ['emergency surgery', 'cancer treatment', 'medical bills', 'therapy', 'medication'],
      education: ['school supplies', 'tuition fees', 'scholarship fund', 'books', 'student aid'],
      animal: ['animal rescue', 'veterinary bills', 'shelter support', 'pet surgery', 'wildlife'],
      emergency: ['disaster relief', 'fire damage', 'flood help', 'hurricane aid', 'earthquake'],
      community: ['community center', 'local support', 'neighborhood help', 'food bank', 'homeless']
    };

    const terms = categoryTerms[category.toLowerCase()] || [];
    
    return terms.slice(0, limit).map((term, index) => ({
      id: `category-${category}-${index}`,
      text: term,
      type: 'suggestion' as const,
      category: category as any
    }));
  }

  /**
   * Track search analytics (for future use)
   */
  trackSearch(query: string, resultCount: number, category?: string) {
    // Track search analytics for future use
    if (process.env.NODE_ENV === 'development') {
      console.debug('Search tracked:', { query, resultCount, category });
    }
  }
}

// Export singleton instance
export const searchSuggestionsService = SearchSuggestionsService.getInstance();
