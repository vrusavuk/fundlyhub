/**
 * Legacy API Service Integration - Forwards to Enterprise Infrastructure
 * This maintains backward compatibility while using the new enterprise services
 */
import { enterpriseApi, enterpriseCache, enterpriseSecurity } from '../enterprise';
import { validateFundraiser, validateDonation, validateProfile } from '../enterprise';

// Re-export enterprise services with legacy names for backward compatibility
export const integratedApiService = enterpriseApi;
export const distributedCache = enterpriseCache;
export const securityMiddleware = enterpriseSecurity;
export const structuredLogger = {
  async info(message: string, context: any = {}) {
    console.info(message, context);
  },
  async error(message: string, error: Error, context: any = {}) {
    console.error(message, error, context);
  },
  async warn(message: string, context: any = {}) {
    console.warn(message, context);
  },
  async debug(message: string, context: any = {}) {
    console.debug(message, context);
  },
  async audit(action: string, resourceType: string, resourceId?: string, context: any = {}) {
    console.log(`AUDIT: ${action} on ${resourceType}`, { resourceId, ...context });
  },
  async performance(operation: string, duration: number, context: any = {}) {
    console.log(`PERF: ${operation} took ${duration}ms`, context);
  }
};

export const performanceMonitor = {
  startRequest(endpoint: string) {
    const startTime = performance.now();
    return {
      end: (result: { success: boolean; responseTime?: number }) => {
        const duration = performance.now() - startTime;
        console.log(`Request to ${endpoint}: ${result.success ? 'SUCCESS' : 'FAILED'} in ${duration}ms`);
      }
    };
  },
  async healthCheck() {
    return {
      status: 'healthy' as const,
      checks: {},
      metrics: {}
    };
  }
};

// Export validation functions
export { validateFundraiser, validateDonation, validateProfile };

// Export the main enterprise infrastructure
export { enterpriseApi, enterpriseCache, enterpriseSecurity } from '../enterprise';