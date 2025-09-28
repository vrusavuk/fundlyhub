/**
 * Request Manager Metrics Extension
 */

export interface RequestManagerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  activeRequests: number;
}

export class RequestMetricsCollector {
  private metrics = {
    total: 0,
    successful: 0,
    failed: 0,
    latencies: [] as number[],
    activeCount: 0
  };

  recordRequest(duration: number, success: boolean): void {
    this.metrics.total++;
    if (success) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
    }
    
    this.metrics.latencies.push(duration);
    
    // Keep only last 1000 latencies for memory efficiency
    if (this.metrics.latencies.length > 1000) {
      this.metrics.latencies = this.metrics.latencies.slice(-1000);
    }
  }

  incrementActive(): void {
    this.metrics.activeCount++;
  }

  decrementActive(): void {
    this.metrics.activeCount = Math.max(0, this.metrics.activeCount - 1);
  }

  getMetrics(): RequestManagerMetrics {
    const sortedLatencies = [...this.metrics.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);

    return {
      totalRequests: this.metrics.total,
      successfulRequests: this.metrics.successful,
      failedRequests: this.metrics.failed,
      errorRate: this.metrics.total > 0 ? this.metrics.failed / this.metrics.total : 0,
      averageLatency: sortedLatencies.length > 0 
        ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length 
        : 0,
      p95Latency: sortedLatencies[p95Index] || 0,
      p99Latency: sortedLatencies[p99Index] || 0,
      activeRequests: this.metrics.activeCount
    };
  }

  reset(): void {
    this.metrics = {
      total: 0,
      successful: 0,
      failed: 0,
      latencies: [],
      activeCount: 0
    };
  }
}
