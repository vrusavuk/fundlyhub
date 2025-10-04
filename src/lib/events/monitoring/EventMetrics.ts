/**
 * Event System Monitoring and Metrics
 * Phase 5: Observability for event-driven architecture
 */

export interface EventMetrics {
  totalPublished: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  eventsByType: Record<string, number>;
  processorMetrics: Record<string, ProcessorMetrics>;
  sagaMetrics: SagaMetrics;
}

export interface ProcessorMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  lastProcessedAt?: number;
  consecutiveFailures: number;
}

export interface SagaMetrics {
  totalStarted: number;
  totalCompleted: number;
  totalFailed: number;
  totalCompensated: number;
  averageSteps: number;
  successRate: number;
}

export class EventMetricsCollector {
  private metrics: EventMetrics = {
    totalPublished: 0,
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    eventsByType: {},
    processorMetrics: {},
    sagaMetrics: {
      totalStarted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalCompensated: 0,
      averageSteps: 0,
      successRate: 0,
    },
  };

  private processingTimes: number[] = [];

  recordEventPublished(eventType: string): void {
    this.metrics.totalPublished++;
    this.metrics.eventsByType[eventType] = (this.metrics.eventsByType[eventType] || 0) + 1;
  }

  recordEventProcessed(processorName: string, processingTime: number, success: boolean): void {
    if (success) {
      this.metrics.totalProcessed++;
    } else {
      this.metrics.totalFailed++;
    }

    // Update processor-specific metrics
    if (!this.metrics.processorMetrics[processorName]) {
      this.metrics.processorMetrics[processorName] = {
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        consecutiveFailures: 0,
      };
    }

    const processorMetrics = this.metrics.processorMetrics[processorName];
    processorMetrics.totalProcessed++;
    processorMetrics.lastProcessedAt = Date.now();

    if (!success) {
      processorMetrics.totalFailed++;
      processorMetrics.consecutiveFailures++;
    } else {
      processorMetrics.consecutiveFailures = 0;
    }

    // Track processing times (keep last 100)
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    // Calculate average processing time
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

    processorMetrics.averageProcessingTime = this.metrics.averageProcessingTime;
  }

  recordSagaStarted(): void {
    this.metrics.sagaMetrics.totalStarted++;
  }

  recordSagaCompleted(steps: number): void {
    this.metrics.sagaMetrics.totalCompleted++;
    this.updateSagaMetrics(steps);
  }

  recordSagaFailed(steps: number, compensated: boolean): void {
    this.metrics.sagaMetrics.totalFailed++;
    if (compensated) {
      this.metrics.sagaMetrics.totalCompensated++;
    }
    this.updateSagaMetrics(steps);
  }

  private updateSagaMetrics(steps: number): void {
    const total = this.metrics.sagaMetrics.totalStarted;
    const completed = this.metrics.sagaMetrics.totalCompleted;
    
    // Calculate average steps
    const currentAvg = this.metrics.sagaMetrics.averageSteps;
    this.metrics.sagaMetrics.averageSteps = 
      ((currentAvg * (total - 1)) + steps) / total;

    // Calculate success rate
    this.metrics.sagaMetrics.successRate = 
      total > 0 ? (completed / total) * 100 : 0;
  }

  getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  getProcessorHealth(processorName: string): 'healthy' | 'degraded' | 'critical' {
    const processor = this.metrics.processorMetrics[processorName];
    
    if (!processor) return 'healthy';

    // Consider processor critical if 5+ consecutive failures
    if (processor.consecutiveFailures >= 5) return 'critical';
    
    // Consider degraded if more than 20% failure rate
    const failureRate = processor.totalFailed / processor.totalProcessed;
    if (failureRate > 0.2) return 'degraded';

    return 'healthy';
  }

  getSagaHealth(): 'healthy' | 'degraded' | 'critical' {
    const { successRate } = this.metrics.sagaMetrics;
    
    if (successRate < 70) return 'critical';
    if (successRate < 90) return 'degraded';
    return 'healthy';
  }

  reset(): void {
    this.metrics = {
      totalPublished: 0,
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      eventsByType: {},
      processorMetrics: {},
      sagaMetrics: {
        totalStarted: 0,
        totalCompleted: 0,
        totalFailed: 0,
        totalCompensated: 0,
        averageSteps: 0,
        successRate: 0,
      },
    };
    this.processingTimes = [];
  }
}

// Global metrics collector instance
export const eventMetrics = new EventMetricsCollector();
