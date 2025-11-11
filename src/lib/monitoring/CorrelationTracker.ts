/**
 * Correlation ID Tracking
 * Enables distributed tracing across service boundaries
 */

import { logger } from '@/lib/services/logger.service';

export interface TraceContext {
  correlationId: string;
  parentSpanId?: string;
  spanId: string;
  traceId: string;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface Span {
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
  status: 'pending' | 'success' | 'error';
  error?: Error;
}

class CorrelationTrackerService {
  private currentContext: TraceContext | null = null;
  private spans: Map<string, Span> = new Map();
  private readonly maxSpans = 1000;

  /**
   * Start a new trace with correlation ID
   */
  startTrace(
    operation: string,
    metadata?: Record<string, any>
  ): TraceContext {
    const traceId = this.generateId();
    const correlationId = this.generateId();
    const spanId = this.generateId();

    const context: TraceContext = {
      correlationId,
      traceId,
      spanId,
      startTime: Date.now(),
      metadata,
    };

    this.currentContext = context;

    // Create root span
    this.startSpan(operation, { root: 'true' });

    logger.info('Trace started', {
      componentName: 'CorrelationTracker',
      operationName: 'startTrace',
      correlationId,
      metadata: { traceId, operation, ...metadata },
    });

    return context;
  }

  /**
   * Get current trace context
   */
  getCurrentContext(): TraceContext | null {
    return this.currentContext;
  }

  /**
   * Set trace context (for continuing a trace)
   */
  setContext(context: TraceContext): void {
    this.currentContext = context;
  }

  /**
   * Clear current trace context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  /**
   * Start a new span in current trace
   */
  startSpan(
    operation: string,
    tags?: Record<string, string>
  ): string {
    if (!this.currentContext) {
      logger.warn('Cannot start span without active trace context', {
        componentName: 'CorrelationTracker',
        operationName: 'startSpan',
        metadata: { operation },
      });
      return '';
    }

    const spanId = this.generateId();
    const span: Span = {
      spanId,
      parentSpanId: this.currentContext.spanId,
      operation,
      startTime: Date.now(),
      tags: tags || {},
      logs: [],
      status: 'pending',
    };

    this.spans.set(spanId, span);

    // Auto-cleanup old spans
    if (this.spans.size > this.maxSpans) {
      const oldestSpanId = this.spans.keys().next().value;
      this.spans.delete(oldestSpanId);
    }

    logger.debug('Span started', {
      componentName: 'CorrelationTracker',
      operationName: 'startSpan',
      correlationId: this.currentContext.correlationId,
      metadata: { spanId, operation, parentSpanId: span.parentSpanId },
    });

    return spanId;
  }

  /**
   * End a span
   */
  endSpan(
    spanId: string,
    status: 'success' | 'error' = 'success',
    error?: Error
  ): void {
    const span = this.spans.get(spanId);
    if (!span) {
      logger.warn('Span not found', {
        componentName: 'CorrelationTracker',
        operationName: 'endSpan',
        metadata: { spanId },
      });
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    if (error) {
      span.error = error;
    }

    logger.debug('Span ended', {
      componentName: 'CorrelationTracker',
      operationName: 'endSpan',
      correlationId: this.currentContext?.correlationId,
      metadata: {
        spanId,
        operation: span.operation,
        duration: span.duration,
        status,
      },
    });

    // Log if span was slow
    if (span.duration > 1000) {
      logger.warn('Slow span detected', {
        componentName: 'CorrelationTracker',
        operationName: 'endSpan',
        correlationId: this.currentContext?.correlationId,
        metadata: {
          spanId,
          operation: span.operation,
          duration: span.duration,
        },
      });
    }
  }

  /**
   * Add log entry to span
   */
  logToSpan(
    spanId: string,
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info'
  ): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        level,
      });
    }
  }

  /**
   * Add tags to span
   */
  addSpanTags(spanId: string, tags: Record<string, string>): void {
    const span = this.spans.get(spanId);
    if (span) {
      Object.assign(span.tags, tags);
    }
  }

  /**
   * Execute function within a span
   */
  async withSpan<T>(
    operation: string,
    fn: (spanId: string) => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const spanId = this.startSpan(operation, tags);
    
    try {
      const result = await fn(spanId);
      this.endSpan(spanId, 'success');
      return result;
    } catch (error) {
      this.endSpan(spanId, 'error', error as Error);
      throw error;
    }
  }

  /**
   * Get span details
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  /**
   * Get all spans for current trace
   */
  getTraceSpans(): Span[] {
    if (!this.currentContext) return [];
    
    return Array.from(this.spans.values()).filter(
      span => span.parentSpanId === this.currentContext!.spanId ||
              span.spanId === this.currentContext!.spanId
    );
  }

  /**
   * Get trace timeline
   */
  getTraceTimeline(): {
    traceId: string;
    correlationId: string;
    totalDuration: number;
    spans: Array<{
      operation: string;
      startOffset: number;
      duration: number;
      status: string;
    }>;
  } | null {
    if (!this.currentContext) return null;

    const traceSpans = this.getTraceSpans();
    if (traceSpans.length === 0) return null;

    const rootSpan = traceSpans.find(s => s.spanId === this.currentContext!.spanId);
    if (!rootSpan || !rootSpan.endTime) return null;

    const timeline = {
      traceId: this.currentContext.traceId,
      correlationId: this.currentContext.correlationId,
      totalDuration: rootSpan.endTime - rootSpan.startTime,
      spans: traceSpans
        .filter(s => s.endTime)
        .map(s => ({
          operation: s.operation,
          startOffset: s.startTime - rootSpan.startTime,
          duration: s.duration || 0,
          status: s.status,
        }))
        .sort((a, b) => a.startOffset - b.startOffset),
    };

    return timeline;
  }

  /**
   * Export trace data for external systems
   */
  exportTrace(): {
    context: TraceContext | null;
    spans: Span[];
    timeline: ReturnType<typeof this.getTraceTimeline>;
  } {
    return {
      context: this.currentContext,
      spans: this.getTraceSpans(),
      timeline: this.getTraceTimeline(),
    };
  }

  /**
   * Clear all spans
   */
  clearSpans(): void {
    this.spans.clear();
    logger.debug('All spans cleared', {
      componentName: 'CorrelationTracker',
      operationName: 'clearSpans',
    });
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}

export const correlationTracker = new CorrelationTrackerService();
