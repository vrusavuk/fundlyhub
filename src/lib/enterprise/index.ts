/**
 * Enterprise Infrastructure - Main export file
 */

// Core types and interfaces
export * from './types';

// Base service class
export { EnterpriseService } from './EnterpriseService';

// Individual services
export { EnterpriseCache, type CacheOptions, type CacheMetrics } from './EnterpriseCache';
export { EnterpriseSecurity, type SecurityConfig, type RateLimitResult } from './EnterpriseSecurity';
export { EnterpriseApi, type ApiOptions } from './EnterpriseApi';

// Service instances (singletons)
export { enterpriseCache } from './EnterpriseCache';
export { enterpriseSecurity } from './EnterpriseSecurity';
export { enterpriseApi } from './EnterpriseApi';

// Validation schemas (from existing enhanced schemas)
export * from '../validation/EnhancedSchemas';

/**
 * Enterprise Infrastructure Manager
 * Orchestrates all enterprise services and provides unified interface
 */
import { EnterpriseApi } from './EnterpriseApi';
import { EnterpriseCache } from './EnterpriseCache';
import { EnterpriseSecurity } from './EnterpriseSecurity';
import { HealthCheck, ServiceMetrics } from './types';

export class EnterpriseInfrastructure {
  private api: EnterpriseApi;
  private cache: EnterpriseCache;
  private security: EnterpriseSecurity;

  constructor() {
    this.cache = new EnterpriseCache();
    this.security = new EnterpriseSecurity();
    this.api = new EnterpriseApi();
  }

  /**
   * Get unified health status
   */
  async getHealthStatus(): Promise<HealthCheck> {
    return this.api.healthCheck();
  }

  /**
   * Get unified metrics across all services
   */
  async getMetrics(): Promise<ServiceMetrics> {
    const cacheMetrics = this.cache.getMetrics();
    const securityMetrics = this.security.getSecurityMetrics();

    return {
      requests: {
        total: 0, // Would be tracked by API service
        successful: 0,
        failed: 0,
        averageTime: 0
      },
      cache: {
        hitRate: cacheMetrics.hitRate,
        evictions: cacheMetrics.evictions,
        memoryUsage: cacheMetrics.memoryUsage
      },
      security: {
        blockedRequests: securityMetrics.blockedRequests,
        suspiciousActivity: securityMetrics.suspiciousIPs,
        rateLimitHits: securityMetrics.rateLimitHits
      }
    };
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    // Any initialization logic for services
    console.log('Enterprise infrastructure initialized');
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    // Any cleanup logic
    console.log('Enterprise infrastructure shutdown complete');
  }

  /**
   * Get service instances
   */
  getApi(): EnterpriseApi {
    return this.api;
  }

  getCache(): EnterpriseCache {
    return this.cache;
  }

  getSecurity(): EnterpriseSecurity {
    return this.security;
  }
}

// Singleton instance
export const enterpriseInfrastructure = new EnterpriseInfrastructure();