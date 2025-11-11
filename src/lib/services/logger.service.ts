/**
 * Unified Logger Service
 * Replaces all console.* calls with structured, environment-aware logging
 * Integrates with StructuredLogger for production monitoring
 */

import { structuredLogger, LogLevel } from '@/lib/monitoring/StructuredLogger';

export type LogContext = {
  userId?: string;
  correlationId?: string;
  componentName?: string;
  operationName?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow any additional properties
};

/**
 * Environment-aware logger that filters logs based on NODE_ENV
 */
class LoggerService {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Debug-level logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
    
    structuredLogger.debug(message, context);
  }

  /**
   * Info-level logging (all environments)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
    
    structuredLogger.info(message, context);
  }

  /**
   * Warning-level logging (all environments)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || '');
    
    structuredLogger.warn(message, context);
  }

  /**
   * Error-level logging (all environments, sent to monitoring)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context || '');
    
    structuredLogger.error(message, error, context || {});
  }

  /**
   * Critical-level logging (production alerts)
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    console.error(`[CRITICAL] ${message}`, error, context || '');
    
    structuredLogger.critical(message, error, context || {});
  }

  /**
   * Audit logging for compliance (always logged)
   */
  audit(
    action: string,
    details: {
      userId: string;
      resource: string;
      resourceId?: string;
      outcome: 'success' | 'failure';
      metadata?: Record<string, any>;
    }
  ): void {
    structuredLogger.audit(
      action,
      details.resource,
      details.resourceId,
      {
        userId: details.userId,
        metadata: {
          outcome: details.outcome,
          ...details.metadata,
        },
      }
    );
  }

  /**
   * Performance logging for monitoring
   */
  performance(
    operation: string,
    durationMs: number,
    context?: LogContext
  ): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${operation}: ${durationMs}ms`, context || '');
    }
    
    structuredLogger.performance(operation, durationMs, context);
  }

  /**
   * Security event logging
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    console.warn(`[SECURITY:${severity.toUpperCase()}] ${event}`, context || '');
    
    structuredLogger.security(event, severity, context);
  }

  /**
   * Time a function execution and log performance
   */
  async timed<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.performance(operation, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`${operation} failed after ${duration}ms`, error as Error, context);
      throw error;
    }
  }

  /**
   * Create a child logger with pre-set context
   */
  withContext(baseContext: LogContext): LoggerService {
    const childLogger = new LoggerService();
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    };

    // Override methods to merge context
    childLogger.debug = (message: string, context?: LogContext) => 
      originalMethods.debug(message, { ...baseContext, ...context });
    
    childLogger.info = (message: string, context?: LogContext) => 
      originalMethods.info(message, { ...baseContext, ...context });
    
    childLogger.warn = (message: string, context?: LogContext) => 
      originalMethods.warn(message, { ...baseContext, ...context });
    
    childLogger.error = (message: string, error?: Error, context?: LogContext) => 
      originalMethods.error(message, error, { ...baseContext, ...context });

    return childLogger;
  }
}

// Export singleton instance
export const logger = new LoggerService();
