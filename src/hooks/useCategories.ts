/**
 * Modern, enterprise-level categories hook
 * Replaces the old hook with better error handling and unified data management
 */
import { useCategories as useEnterpriseCategories } from './useCategories.enterprise';

// Re-export the enterprise version as the main hook
export function useCategories() {
  return useEnterpriseCategories();
}