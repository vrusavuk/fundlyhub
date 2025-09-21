/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  name: 'FundlyHub',
  description: 'Connecting causes with caring people worldwide',
  version: '1.0.0',
} as const;

export const API_CONFIG = {
  pagination: {
    defaultLimit: 12,
    maxLimit: 50,
  },
  cache: {
    defaultTTL: 300000, // 5 minutes
  },
} as const;

export const VALIDATION_RULES = {
  fundraiser: {
    titleMinLength: 5,
    titleMaxLength: 100,
    summaryMaxLength: 500,
    minGoalAmount: 100,
    maxGoalAmount: 1000000,
  },
  donation: {
    minAmount: 5,
    maxAmount: 100000,
  },
} as const;

export const ROUTES = {
  home: '/',
  campaigns: '/campaigns',
  auth: '/auth',
  create: '/create',
  fundlyGive: '/fundly-give',
  fundraiser: (slug: string) => `/fundraiser/${slug}`,
} as const;