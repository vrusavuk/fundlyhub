/**
 * Enterprise Structured Logging System
 */
import { supabase } from '@/integrations/supabase/client';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  [key: string]: any; // Allow additional properties for flexibility
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  environment: string;
  version: string;
}

class StructuredLogger {
  private logLevel: LogLevel = LogLevel.INFO;
  private environment: string = import.meta.env.MODE || 'development';
  private version: string = '1.0.0';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  /**
   * Set minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Debug level logging
   */
  async debug(message: string, context: LogContext = {}): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  async info(message: string, context: LogContext = {}): Promise<void> {
    await this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  async warn(message: string, context: LogContext = {}): Promise<void> {
    await this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  async error(message: string, error?: Error, context: LogContext = {}): Promise<void> {
    const errorDetails = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    await this.log(LogLevel.ERROR, message, context, errorDetails);
  }

  /**
   * Critical level logging
   */
  async critical(message: string, error?: Error, context: LogContext = {}): Promise<void> {
    const errorDetails = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    await this.log(LogLevel.CRITICAL, message, context, errorDetails);
    
    // For critical errors, also send to external monitoring
    await this.sendToExternalMonitoring(message, error, context);
  }

  /**
   * Audit logging for compliance
   */
  async audit(
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    context: LogContext = {}
  ): Promise<void> {
    try {
      // Log to audit system
      await supabase.rpc('log_audit_event', {
        _actor_id: context.userId || null,
        _action: action,
        _resource_type: resourceType,
        _resource_id: resourceId || null,
        _metadata: context.metadata || {},
        _ip_address: null, // Would be populated with real IP
        _user_agent: navigator.userAgent
      });

      // Also log as structured log
      await this.info(`Audit: ${action} on ${resourceType}`, {
        ...context,
        tags: [...(context.tags || []), 'audit'],
        metadata: {
          ...context.metadata,
          action,
          resourceType,
          resourceId
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Performance logging
   */
  async performance(
    operation: string,
    duration: number,
    context: LogContext = {}
  ): Promise<void> {
    await this.info(`Performance: ${operation}`, {
      ...context,
      tags: [...(context.tags || []), 'performance'],
      metadata: {
        ...context.metadata,
        operation,
        duration,
        performanceGrade: this.getPerformanceGrade(duration)
      }
    });
  }

  /**
   * Security event logging
   */
  async security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: LogContext = {}
  ): Promise<void> {
    const level = this.getLogLevelFromSeverity(severity);
    
    await this.log(level, `Security: ${event}`, {
      ...context,
      tags: [...(context.tags || []), 'security', severity],
      metadata: {
        ...context.metadata,
        securityEvent: event,
        severity
      }
    });
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: any
  ): Promise<void> {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      environment: this.environment,
      version: this.version
    };

    // Console logging for development
    if (this.environment === 'development') {
      this.logToConsole(logEntry);
    }

    // Buffer for batch sending
    this.logBuffer.push(logEntry);
    
    // Send immediately for errors and critical
    if (level >= LogLevel.ERROR) {
      await this.flushLogs();
    } else if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flushLogs();
    }
  }

  /**
   * Flush logs to external system
   */
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In a real implementation, send to external logging service
      // For now, we'll store critical logs in our security events table
      const criticalLogs = logsToSend.filter(log => log.level >= LogLevel.ERROR);
      
      for (const log of criticalLogs) {
        await supabase.rpc('log_security_event', {
          _event_type: 'application_error',
          _user_id: log.context.userId || null,
          _ip_address: null,
          _user_agent: null,
          _request_path: log.context.operation || null,
          _request_method: null,
          _success: false,
          _details: {
            level: LogLevel[log.level],
            message: log.message,
            error: log.error ? {
              name: log.error.name,
              message: log.error.message,
              stack: log.error.stack,
              code: log.error.code
            } : null,
            context: JSON.parse(JSON.stringify(log.context)) // Ensure JSON serializable
          }
        });
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Re-add logs to buffer on failure
      this.logBuffer.unshift(...logsToSend);
    }
  }

  /**
   * Get logs for analysis (admin only)
   */
  async getLogs(
    filters: {
      level?: LogLevel;
      startTime?: string;
      endTime?: string;
      userId?: string;
      component?: string;
      limit?: number;
    } = {}
  ): Promise<LogEntry[]> {
    // This would query your log storage system
    // For now, return empty array
    return [];
  }

  /**
   * Helper methods
   */
  private logToConsole(entry: LogEntry): void {
    const logMethod = this.getConsoleMethod(entry.level);
    const contextStr = Object.keys(entry.context).length > 0 
      ? JSON.stringify(entry.context, null, 2) 
      : '';
    
    logMethod(
      `[${entry.timestamp}] ${LogLevel[entry.level]}: ${entry.message}`,
      contextStr,
      entry.error || ''
    );
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private getPerformanceGrade(duration: number): string {
    if (duration < 100) return 'excellent';
    if (duration < 300) return 'good';
    if (duration < 1000) return 'acceptable';
    return 'poor';
  }

  private getLogLevelFromSeverity(severity: string): LogLevel {
    switch (severity) {
      case 'low': return LogLevel.INFO;
      case 'medium': return LogLevel.WARN;
      case 'high': return LogLevel.ERROR;
      case 'critical': return LogLevel.CRITICAL;
      default: return LogLevel.INFO;
    }
  }

  private async sendToExternalMonitoring(
    message: string, 
    error?: Error, 
    context: LogContext = {}
  ): Promise<void> {
    // In production, integrate with services like:
    // - Sentry for error tracking
    // - DataDog for monitoring
    // - New Relic for APM
    // - Custom webhook endpoints
    
    console.error('CRITICAL ERROR - External monitoring integration needed:', {
      message,
      error,
      context
    });
  }
}

export const structuredLogger = new StructuredLogger();