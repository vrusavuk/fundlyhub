/**
 * Cursor-based pagination for scalable and consistent data retrieval
 * Replaces offset-based pagination to avoid consistency issues at scale
 */

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasNext: boolean;
  hasPrev: boolean;
  totalCount?: number;
}

export interface CursorConfig {
  defaultLimit: number;
  maxLimit: number;
  defaultSortField: string;
  allowedSortFields: string[];
}

export class CursorPagination {
  private readonly config: CursorConfig = {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortField: 'created_at',
    allowedSortFields: ['created_at', 'updated_at', 'id', 'total_raised', 'goal_amount']
  };

  /**
   * Build cursor-based query with deterministic ordering (includes unique tiebreaker)
   */
  buildQuery(
    baseQuery: any,
    params: CursorPaginationParams
  ): any {
    const limit = Math.min(params.limit || this.config.defaultLimit, this.config.maxLimit);
    const sortField = this.validateSortField(params.sortField || this.config.defaultSortField);
    const sortOrder = params.sortOrder || 'desc';
    const direction = params.direction || 'forward';

    let query = baseQuery;

    // Apply cursor filtering with deterministic comparison
    if (params.cursor) {
      const cursorData = this.decodeCursor(params.cursor);
      const operator = this.getFilterOperator(sortOrder, direction);
      
      // Use composite filtering for deterministic pagination
      if (sortField !== 'id') {
        // Filter by primary sort field OR (same value AND id comparison)
        const idOperator = sortOrder === 'desc' ? 'lt' : 'gt';
        if (direction === 'backward') {
          const oppositeOperator = sortOrder === 'desc' ? 'gt' : 'lt';
          const oppositeIdOperator = sortOrder === 'desc' ? 'gt' : 'lt';
          query = query.or(`${sortField}.${oppositeOperator}.${cursorData.value},and(${sortField}.eq.${cursorData.value},id.${oppositeIdOperator}.${cursorData.id})`);
        } else {
          query = query.or(`${sortField}.${operator}.${cursorData.value},and(${sortField}.eq.${cursorData.value},id.${idOperator}.${cursorData.id})`);
        }
      } else {
        query = query.filter('id', operator, cursorData.id);
      }
    }

    // Apply deterministic sorting with unique tiebreaker
    const ascending = sortOrder === 'asc';
    query = query.order(sortField, { ascending });
    
    // Add unique tiebreaker if not already sorting by id
    if (sortField !== 'id') {
      query = query.order('id', { ascending });
    }

    // Apply limit (add 1 to check if there are more results)
    query = query.limit(limit + 1);

    return query;
  }

  /**
   * Process query results and create pagination metadata
   */
  processResults<T extends Record<string, any>>(
    data: T[],
    params: CursorPaginationParams
  ): CursorPaginationResult<T> {
    const limit = Math.min(params.limit || this.config.defaultLimit, this.config.maxLimit);
    const sortField = this.validateSortField(params.sortField || this.config.defaultSortField);
    
    // Check if there are more results
    const hasNext = data.length > limit;
    const actualData = hasNext ? data.slice(0, limit) : data;
    
    // Generate cursors
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (actualData.length > 0) {
      const lastItem = actualData[actualData.length - 1];
      const firstItem = actualData[0];

      if (hasNext) {
        nextCursor = this.encodeCursor(lastItem[sortField], lastItem);
      }
      
      if (params.cursor) {
        prevCursor = this.encodeCursor(firstItem[sortField], firstItem);
      }
    }

    return {
      data: actualData,
      nextCursor,
      prevCursor,
      hasNext,
      hasPrev: !!params.cursor,
    };
  }

  /**
   * Create pagination links for API responses
   */
  createPaginationLinks(
    baseUrl: string,
    params: CursorPaginationParams,
    result: CursorPaginationResult<any>
  ): Record<string, string> {
    const links: Record<string, string> = {};
    const queryParams = new URLSearchParams();

    // Add base parameters
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortField) queryParams.set('sort', params.sortField);
    if (params.sortOrder) queryParams.set('order', params.sortOrder);

    // Next link
    if (result.hasNext && result.nextCursor) {
      const nextParams = new URLSearchParams(queryParams);
      nextParams.set('cursor', result.nextCursor);
      nextParams.set('direction', 'forward');
      links.next = `${baseUrl}?${nextParams.toString()}`;
    }

    // Previous link
    if (result.hasPrev && result.prevCursor) {
      const prevParams = new URLSearchParams(queryParams);
      prevParams.set('cursor', result.prevCursor);
      prevParams.set('direction', 'backward');
      links.prev = `${baseUrl}?${prevParams.toString()}`;
    }

    // First link
    const firstParams = new URLSearchParams(queryParams);
    firstParams.delete('cursor');
    firstParams.delete('direction');
    links.first = `${baseUrl}?${firstParams.toString()}`;

    return links;
  }

  /**
   * Encode cursor with multiple fields for deterministic ordering
   */
  private encodeCursor(value: any, item?: Record<string, any>): string {
    const cursorData = {
      value,
      id: item?.id,
      timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode cursor to extract all fields
   */
  private decodeCursor(cursor: string): any {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const cursorData = JSON.parse(decoded);
      return cursorData; // Return full cursor data including id
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Get filter operator based on sort order and direction
   */
  private getFilterOperator(sortOrder: string, direction: string): string {
    if (direction === 'forward') {
      return sortOrder === 'asc' ? 'gt' : 'lt';
    } else {
      return sortOrder === 'asc' ? 'lt' : 'gt';
    }
  }

  /**
   * Validate sort field
   */
  private validateSortField(field: string): string {
    if (!this.config.allowedSortFields.includes(field)) {
      throw new Error(`Invalid sort field: ${field}`);
    }
    return field;
  }

  /**
   * Convert offset-based pagination to cursor-based for backward compatibility
   */
  offsetToCursor(offset: number, limit: number, sortField?: string): CursorPaginationParams {
    // This is a simplified conversion - in practice, you'd need to query for the item at the offset
    // For now, we'll just return cursor-based params without a cursor (starts from beginning)
    return {
      limit,
      sortField: sortField || this.config.defaultSortField,
      direction: 'forward'
    };
  }
}