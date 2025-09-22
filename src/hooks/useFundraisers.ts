/**
 * Modern, enterprise-level fundraiser hook
 * Replaces the old hook with better error handling and performance
 */
import { useFundraisers as useEnterpriseFundraisers } from './useFundraisers.enterprise';
import type { FundraiserQueryOptions } from '@/lib/services/fundraiser.service';

// Re-export the enterprise version as the main hook
export function useFundraisers(options: FundraiserQueryOptions = {}) {
  return useEnterpriseFundraisers(options);
}