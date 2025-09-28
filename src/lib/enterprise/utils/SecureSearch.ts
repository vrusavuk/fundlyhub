/**
 * Secure search utilities with FTS and proper escaping
 */

export interface SearchOptions {
  type?: 'websearch' | 'phrase' | 'plain';
  language?: string;
  highlight?: boolean;
  maxResults?: number;
}

export interface SearchConfig {
  ftsColumn?: string;
  searchableColumns: string[];
  rankingColumns?: Record<string, number>;
}

export class SecureSearch {
  /**
   * Build secure full-text search query
   */
  static buildFTSQuery(
    query: string,
    config: SearchConfig,
    options: SearchOptions = {}
  ): { 
    ftsQuery?: string; 
    searchQuery?: string; 
    rankQuery?: string 
  } {
    if (!query?.trim()) {
      return {};
    }

    const sanitizedQuery = this.sanitizeSearchQuery(query);
    const { type = 'websearch' } = options;

    // Build FTS query if FTS column is available
    let ftsQuery;
    if (config.ftsColumn) {
      ftsQuery = this.buildFTSFilter(sanitizedQuery, config.ftsColumn, type);
    }

    // Build fallback ILIKE query for columns without FTS
    const searchQuery = this.buildILikeQuery(sanitizedQuery, config.searchableColumns);

    // Build ranking query if specified
    const rankQuery = config.rankingColumns 
      ? this.buildRankingQuery(sanitizedQuery, config.rankingColumns)
      : undefined;

    return { ftsQuery, searchQuery, rankQuery };
  }

  /**
   * Sanitize search query to prevent injection
   */
  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/[%_]/g, '\\$&') // Escape LIKE wildcards
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Build FTS filter for websearch
   */
  private static buildFTSFilter(
    query: string,
    ftsColumn: string,
    type: string
  ): string {
    const escapedQuery = query.replace(/'/g, "''");
    return `${ftsColumn}.fts.${type}.'${escapedQuery}'`;
  }

  /**
   * Build secure ILIKE query with proper escaping
   */
  private static buildILikeQuery(
    query: string,
    columns: string[]
  ): string {
    const escapedQuery = this.escapeForILike(query);
    return columns
      .map(column => `${column}.ilike.%${escapedQuery}%`)
      .join(',');
  }

  /**
   * Build ranking query for relevance scoring
   */
  private static buildRankingQuery(
    query: string,
    rankingColumns: Record<string, number>
  ): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const conditions = Object.entries(rankingColumns)
      .map(([column, weight]) => {
        const wordConditions = queryWords
          .map(word => `${column}.ilike.%${this.escapeForILike(word)}%`)
          .join(' OR ');
        return `(CASE WHEN ${wordConditions} THEN ${weight} ELSE 0 END)`;
      });

    return conditions.join(' + ');
  }

  /**
   * Escape special characters for ILIKE
   */
  private static escapeForILike(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
  }

  /**
   * Build filters for faceted search
   */
  static buildFilters(filters: Record<string, any>): Record<string, any> {
    const sanitizedFilters: Record<string, any> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      // Validate filter key (whitelist approach)
      if (!this.isValidFilterKey(key)) {
        continue;
      }

      // Sanitize filter value based on type
      sanitizedFilters[key] = this.sanitizeFilterValue(value);
    }

    return sanitizedFilters;
  }

  /**
   * Validate filter keys against whitelist
   */
  private static isValidFilterKey(key: string): boolean {
    const allowedKeys = [
      'category_id',
      'status',
      'visibility',
      'location',
      'currency',
      'owner_user_id',
      'org_id',
      'created_at',
      'updated_at',
      'goal_amount',
      'tags'
    ];
    return allowedKeys.includes(key);
  }

  /**
   * Sanitize filter values
   */
  private static sanitizeFilterValue(value: any): any {
    if (typeof value === 'string') {
      return value.trim().substring(0, 100);
    }
    if (typeof value === 'number') {
      return Math.max(0, Math.min(value, Number.MAX_SAFE_INTEGER));
    }
    if (Array.isArray(value)) {
      return value.slice(0, 10).map(v => this.sanitizeFilterValue(v));
    }
    return value;
  }

  /**
   * Build secure sort options
   */
  static buildSortOptions(sort: string): { column: string; ascending: boolean } | null {
    const allowedSorts = {
      'recent': { column: 'created_at', ascending: false },
      'popular': { column: 'total_raised', ascending: false },
      'goal': { column: 'goal_amount', ascending: false },
      'alphabetical': { column: 'title', ascending: true },
      'updated': { column: 'updated_at', ascending: false }
    };

    return allowedSorts[sort as keyof typeof allowedSorts] || null;
  }
}