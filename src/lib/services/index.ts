/**
 * Services barrel export
 * Single source of truth for all application services
 */

// Core unified services (RECOMMENDED - use these)
export { unifiedApi, ApiError, type RetryConfig, type CacheConfig, type QueryOptions, type ServiceResponse } from './unified-api.service';
export { authService, type AuthResult, type SignUpData, type SignInData } from './auth.service';
export { cacheService } from './cache.service';

// Domain services (thin wrappers around unifiedApi)
export { fundraiserService, type FundraiserQueryOptions, type FundraiserStats, type PaginatedResult } from './fundraiser.service';
export { categoryService } from './category.service';

// Search service (API Gateway)
export { searchApi } from './searchApi.service';

// Campaign access API (private fundraisers)
export { campaignAccessApi } from '@/lib/api/campaignAccessApi';

// Admin services
export { 
  adminDataService, 
  type PaginationOptions, 
  type FilterOptions 
} from './AdminDataService';

// Legacy services (DEPRECATED - migrate to unifiedApi)
export { queryService } from './query.service';
export { mutationService } from './mutation.service';
export { apiService } from './api.service';
