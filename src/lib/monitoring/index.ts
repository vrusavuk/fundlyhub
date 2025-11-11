/**
 * Monitoring System Exports
 * Centralized access to all monitoring services
 */

export { structuredLogger, LogLevel } from './StructuredLogger';
export type { LogContext, LogEntry } from './StructuredLogger';

export { performanceMonitor } from './PerformanceMonitor';
export type { PerformanceMetrics, PerformanceThresholds } from './PerformanceMonitor';

export { alertManager } from './AlertManager';
export type { AlertRule, Alert, AlertCondition, AlertAction } from './AlertManager';

export { correlationTracker } from './CorrelationTracker';
export type { TraceContext, Span } from './CorrelationTracker';

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring(): void {
  // Performance monitoring is auto-initialized
  // Alert manager is auto-initialized with default rules
  // Correlation tracker is ready to use
  
  console.info('📊 Monitoring system initialized');
}

/**
 * Cleanup monitoring services
 */
export async function cleanupMonitoring(): Promise<void> {
  const { performanceMonitor } = await import('./PerformanceMonitor');
  const { correlationTracker } = await import('./CorrelationTracker');
  
  performanceMonitor.destroy();
  correlationTracker.clearContext();
  correlationTracker.clearSpans();
  
  console.info('📊 Monitoring system cleaned up');
}
