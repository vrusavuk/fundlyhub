/**
 * Search-related types
 */

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  image?: string;
  snippet?: string;
  link: string;
  relevanceScore?: number;
  highlightedTitle?: string;
  highlightedSubtitle?: string;
  matchedFields?: string[];
}

export type SearchResultType = 'campaign' | 'user' | 'organization';