/**
 * User Search Utilities - Phase 3
 * Provides query preprocessing, normalization, and fuzzy search helpers
 */

/**
 * Normalize search query for better matching
 * - Removes extra whitespace
 * - Handles common name variations
 * - Normalizes case
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .toLowerCase();
}

/**
 * Generate phonetic variations of a name for better matching
 * Handles common name spelling variations
 */
export function generatePhoneticVariations(name: string): string[] {
  const normalized = normalizeSearchQuery(name);
  const variations = new Set<string>([normalized]);

  // Common name variations mapping
  const phoneticMappings: Record<string, string[]> = {
    // Slavic name variations
    'liubov': ['lyubov', 'lubov', 'liubov', 'ljubov'],
    'lyubov': ['liubov', 'lubov', 'ljubov'],
    'lubov': ['liubov', 'lyubov', 'ljubov'],
    
    // Common English variations
    'john': ['jon', 'johnny'],
    'sarah': ['sara'],
    'katherine': ['kathryn', 'catherine'],
    'steven': ['stephen'],
    
    // Y/I variations common in transliterations
    'soloveva': ['solovyeva', 'solovieva'],
    'solovyeva': ['soloveva', 'solovieva'],
  };

  // Check if the normalized name has known variations
  Object.entries(phoneticMappings).forEach(([key, variants]) => {
    if (normalized.includes(key)) {
      variants.forEach(variant => {
        variations.add(normalized.replace(key, variant));
      });
    }
  });

  return Array.from(variations);
}

/**
 * Calculate optimal similarity threshold based on query length
 * Shorter queries need lower thresholds to avoid missing relevant matches
 * 
 * Note: The database function fuzzy_search_users also adjusts thresholds dynamically:
 * - ≤3 chars: 0.15 threshold (very permissive for "liu" → "Luibov")
 * - ≤5 chars: 0.25 threshold
 * - >5 chars: uses provided threshold (default 0.3)
 */
export function calculateSimilarityThreshold(query: string): number {
  const length = query.trim().length;
  
  if (length <= 3) return 0.15; // Very permissive for short queries like "liu"
  if (length <= 5) return 0.25; // Moderate for medium queries
  if (length <= 8) return 0.4;  // More lenient for longer queries
  return 0.3; // Default for very long queries
}

/**
 * Extract search terms from query for multi-field search
 * Splits query into individual terms and filters out noise words
 */
export function extractSearchTerms(query: string): string[] {
  const noiseWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  return normalizeSearchQuery(query)
    .split(/\s+/)
    .filter(term => term.length > 1 && !noiseWords.has(term));
}

/**
 * Generate weighted field queries for multi-field search
 * Different fields have different importance weights
 */
export interface FieldWeight {
  field: string;
  weight: number;
}

export const USER_SEARCH_FIELD_WEIGHTS: FieldWeight[] = [
  { field: 'name', weight: 1.0 },      // Highest priority
  { field: 'bio', weight: 0.6 },       // Medium priority
  { field: 'location', weight: 0.4 },  // Lower priority
];

/**
 * Format match type for display
 */
export function formatMatchType(matchType: string): string {
  const labels: Record<string, string> = {
    exact: 'Exact match',
    similar: 'Similar name',
    phonetic: 'Sounds like',
    fuzzy: 'Related',
  };
  
  return labels[matchType] || matchType;
}

/**
 * Generate search suggestions for "Did you mean?" feature
 */
export function generateSearchSuggestions(query: string): string[] {
  const suggestions = new Set<string>();
  const variations = generatePhoneticVariations(query);
  
  // Add phonetic variations as suggestions
  variations.forEach(variant => {
    if (variant !== query.toLowerCase()) {
      suggestions.add(variant);
    }
  });
  
  return Array.from(suggestions).slice(0, 3); // Limit to 3 suggestions
}

/**
 * Check if a match is high confidence based on relevance score
 */
export function isHighConfidenceMatch(relevanceScore: number): boolean {
  return relevanceScore >= 0.7;
}

/**
 * Sort results by relevance score (descending)
 */
export function sortByRelevance<T extends { relevanceScore?: number }>(results: T[]): T[] {
  return [...results].sort((a, b) => {
    const scoreA = a.relevanceScore ?? 0;
    const scoreB = b.relevanceScore ?? 0;
    return scoreB - scoreA;
  });
}
