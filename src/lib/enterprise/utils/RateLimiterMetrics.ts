/**
 * Rate Limiter Metrics Extension
 */

export interface RateLimiterMetrics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  blockRate: number;
  activeLimits: number;
}

export class RateLimitMetricsCollector {
  private metrics = {
    total: 0,
    allowed: 0,
    blocked: 0,
    activeLimits: new Set<string>()
  };

  recordRequest(allowed: boolean, key: string): void {
    this.metrics.total++;
    if (allowed) {
      this.metrics.allowed++;
    } else {
      this.metrics.blocked++;
    }
    this.metrics.activeLimits.add(key);
  }

  getMetrics(): RateLimiterMetrics {
    return {
      totalRequests: this.metrics.total,
      allowedRequests: this.metrics.allowed,
      blockedRequests: this.metrics.blocked,
      blockRate: this.metrics.total > 0 ? this.metrics.blocked / this.metrics.total : 0,
      activeLimits: this.metrics.activeLimits.size
    };
  }

  reset(): void {
    this.metrics = {
      total: 0,
      allowed: 0,
      blocked: 0,
      activeLimits: new Set<string>()
    };
  }
}