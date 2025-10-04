/**
 * Search API Service - Frontend client for search-api edge function
 * 
 * This service replaces direct database queries with API calls to the Search API gateway.
 * All search operations should go through this service.
 * 
 * @see supabase/functions/search-api/index.ts
 * @see docs/search/architecture.md
 */

import { supabase } from '@/integrations/supabase/client';

const SEARCH_API_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://sgcaqrtnxqhrrqzxmupa.supabase.co'}/functions/v1/search-api`;

export interface SearchFilters {
  category?: string;
  location?: string;
  status?: string;
  visibility?: string;
}

export interface SearchOptions {
  scope?: 'all' | 'users' | 'campaigns' | 'orgs';
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'campaign' | 'organization';
  title: string;
  subtitle?: string;
  snippet?: string;
  link: string;
  score?: number;
  highlights?: Record<string, string>;
  image?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  executionTimeMs: number;
  cached: boolean;
  suggestions?: string[];
  cursor?: string;
  error?: string;
}

export interface SuggestResponse {
  suggestions: string[];
  executionTimeMs: number;
}

class SearchApiService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = SEARCH_API_URL;
  }

  /**
   * Execute a search query
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      return {
        results: [],
        total: 0,
        executionTimeMs: 0,
        cached: false,
        error: 'Query must be at least 2 characters',
      };
    }

    try {
      // Build query parameters
      const params = new URLSearchParams({
        q: query.trim(),
        scope: options.scope || 'all',
        limit: String(options.limit || 20),
        offset: String(options.offset || 0),
      });

      // Get auth token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.apiUrl}/search?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Search API error:', error);
      return {
        results: [],
        total: 0,
        executionTimeMs: 0,
        cached: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  /**
   * Get search suggestions (typeahead)
   */
  async suggest(query: string, limit: number = 10): Promise<SuggestResponse> {
    if (!query || query.trim().length < 2) {
      return { suggestions: [], executionTimeMs: 0 };
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(Math.min(limit, 20)),
      });

      const response = await fetch(`${this.apiUrl}/suggest?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Suggest failed: ${response.status}`);
      }

      const data: SuggestResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Suggest API error:', error);
      return { suggestions: [], executionTimeMs: 0 };
    }
  }

  /**
   * Check API health
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'unhealthy', timestamp: new Date().toISOString() };
    }
  }
}

// Export singleton instance
export const searchApi = new SearchApiService();
