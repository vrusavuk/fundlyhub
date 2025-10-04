/**
 * Cache utilities barrel export
 * @deprecated Use cacheService from @/lib/services instead
 */

export { AdminCache } from './AdminCache';

// Re-export new unified cache service
export { cacheService } from '@/lib/services/cache.service';
