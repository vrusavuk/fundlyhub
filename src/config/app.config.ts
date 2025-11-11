/**
 * Application Configuration
 * Centralized configuration for all hardcoded values
 * 
 * Benefits:
 * - Single source of truth for configuration
 * - Easy to override per environment
 * - Type-safe configuration access
 * - No magic numbers scattered in code
 */

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Default TTL for cached items (5 minutes)
  defaultTTL: 300000,
  
  // Maximum cache size (number of items)
  maxSize: 10000,
  
  // Stale-while-revalidate time (1 minute)
  staleTime: 60000,
  
  // Single-flight request timeout (10 seconds)
  singleFlightTimeout: 10000,
  
  // Cache key prefixes
  prefixes: {
    fundraiser: 'fundraiser:',
    category: 'category:',
    user: 'user:',
    search: 'search:',
  },
} as const;

/**
 * Currency configuration
 */
export const CURRENCY_CONFIG = {
  // Default currency for new fundraisers
  default: 'USD',
  
  // Supported currencies
  supported: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  
  // Currency symbols
  symbols: {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  },
} as const;

/**
 * Fundraiser validation rules
 */
export const FUNDRAISER_CONFIG = {
  // Title constraints
  title: {
    minLength: 5,
    maxLength: 100,
  },
  
  // Summary constraints
  summary: {
    maxLength: 500,
  },
  
  // Story constraints
  story: {
    minLength: 100,
    maxLength: 10000,
  },
  
  // Goal amount constraints
  goal: {
    min: 100,
    max: 10000000,
  },
  
  // Slug constraints
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 100,
  },
} as const;

/**
 * Donation configuration
 */
export const DONATION_CONFIG = {
  // Amount constraints
  amount: {
    min: 5,
    max: 100000,
  },
  
  // Processing fees
  fees: {
    percentage: 0.029, // 2.9%
    fixed: 0.30, // $0.30
  },
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  // Default page size
  defaultLimit: 12,
  
  // Maximum page size
  maxLimit: 50,
  
  // Infinite scroll batch size
  infiniteScrollBatchSize: 12,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  // Request timeout (30 seconds)
  timeout: 30000,
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
  },
} as const;

/**
 * Event bus configuration
 */
export const EVENT_BUS_CONFIG = {
  // Local storage threshold (bytes)
  localStorageThreshold: 50 * 1024, // 50KB
  
  // Event processing timeout (5 seconds)
  processingTimeout: 5000,
  
  // Max event buffer size
  maxBufferSize: 1000,
  
  // Event retention time (24 hours)
  eventRetentionMs: 24 * 60 * 60 * 1000,
} as const;

/**
 * Image upload configuration
 */
export const IMAGE_CONFIG = {
  // Max file size (5MB)
  maxFileSize: 5 * 1024 * 1024,
  
  // Allowed MIME types
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Max dimensions
  maxWidth: 4096,
  maxHeight: 4096,
  
  // Thumbnail dimensions
  thumbnail: {
    width: 400,
    height: 400,
  },
} as const;

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  fundraiserImages: 'fundraiser-images',
  profileAvatars: 'profile-avatars',
  organizationLogos: 'organization-logos',
} as const;

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  // Enable analytics tracking
  analytics: true,
  
  // Enable A/B testing
  abTesting: false,
  
  // Enable social sharing
  socialSharing: true,
  
  // Enable project milestones
  projectMilestones: true,
  
  // Enable private fundraisers
  privateFundraisers: true,
} as const;

/**
 * SEO configuration
 */
export const SEO_CONFIG = {
  siteName: 'FundlyHub',
  defaultTitle: 'FundlyHub - Connecting Causes with Caring People',
  defaultDescription: 'Create and support meaningful fundraising campaigns worldwide',
  twitterHandle: '@fundlyhub',
  ogImageDefault: '/og-image.jpg',
} as const;

/**
 * Draft persistence configuration
 */
export const DRAFT_CONFIG = {
  // Auto-save interval (30 seconds)
  autoSaveInterval: 30000,
  
  // Draft expiration time (7 days)
  expirationMs: 7 * 24 * 60 * 60 * 1000,
  
  // Local storage key prefix
  keyPrefix: 'fundraiser_draft:',
} as const;

/**
 * Get configuration value by path
 * Example: getConfig('CACHE_CONFIG.defaultTTL')
 */
export function getConfig(path: string): any {
  const parts = path.split('.');
  let value: any = {
    CACHE_CONFIG,
    CURRENCY_CONFIG,
    FUNDRAISER_CONFIG,
    DONATION_CONFIG,
    PAGINATION_CONFIG,
    API_CONFIG,
    EVENT_BUS_CONFIG,
    IMAGE_CONFIG,
    STORAGE_BUCKETS,
    FEATURE_FLAGS,
    SEO_CONFIG,
    DRAFT_CONFIG,
  };
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value;
}

/**
 * Type-safe configuration access
 */
export const AppConfig = {
  cache: CACHE_CONFIG,
  currency: CURRENCY_CONFIG,
  fundraiser: FUNDRAISER_CONFIG,
  donation: DONATION_CONFIG,
  pagination: PAGINATION_CONFIG,
  api: API_CONFIG,
  eventBus: EVENT_BUS_CONFIG,
  image: IMAGE_CONFIG,
  storage: STORAGE_BUCKETS,
  features: FEATURE_FLAGS,
  seo: SEO_CONFIG,
  draft: DRAFT_CONFIG,
} as const;
