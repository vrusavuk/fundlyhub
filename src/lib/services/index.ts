/**
 * Services barrel export
 * Single source of truth for all application services
 */

// New unified services (recommended)
export { authService, type AuthResult, type SignUpData, type SignInData } from './auth.service';
export { cacheService } from './cache.service';
export { queryService } from './query.service';
export { mutationService } from './mutation.service';

// Search service (API Gateway - use this for all search operations)
export { searchApi } from './searchApi.service';

// Admin services
export { 
  adminDataService, 
  type PaginationOptions, 
  type FilterOptions 
} from './AdminDataService';

// Legacy services (for backward compatibility - will be deprecated)
export { apiService } from './api.service';
export { AdminCache } from '@/lib/cache/AdminCache';
export { enterpriseApi } from '@/lib/enterprise';
