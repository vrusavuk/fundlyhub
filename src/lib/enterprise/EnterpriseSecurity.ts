/**
 * Refactored Security Service
 */
import { EnterpriseService } from './EnterpriseService';
import { RequestContext, SecurityEvent, HealthCheck } from './types';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityConfig {
  rateLimitRequests: number;
  rateLimitWindow: number;
  maxRequestSize: number;
  allowedOrigins: string[];
  enableCsrfProtection: boolean;
  blockSuspiciousActivity: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

export interface ValidationResult {
  valid: boolean;
  sanitizedData?: any;
  violations: string[];
}

export class EnterpriseSecurity extends EnterpriseService {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private suspiciousIPs = new Set<string>();
  private securityConfig: SecurityConfig;

  constructor() {
    super();
    this.securityConfig = {
      rateLimitRequests: this.getLimit('rateLimitRequests'),
      rateLimitWindow: this.getLimit('rateLimitWindow'),
      maxRequestSize: this.getLimit('requestSize'),
      allowedOrigins: [
        'https://sgcaqrtnxqhrrqzxmupa.supabase.co',
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      enableCsrfProtection: true,
      blockSuspiciousActivity: true
    };
  }

  /**
   * Comprehensive security check
   */
  async validateRequest(
    context: RequestContext,
    requestData?: any
  ): Promise<ValidationResult> {
    const violations: string[] = [];
    
    try {
      // Rate limiting
      const rateLimitResult = await this.checkRateLimit(context);
      if (!rateLimitResult.allowed) {
        violations.push('Rate limit exceeded');
        await this.logSecurityEvent('rate_limit_exceeded', 'medium', context, {
          remainingRequests: rateLimitResult.remainingRequests
        });
      }

      // Request size validation
      if (requestData && !this.validateRequestSize(requestData)) {
        violations.push('Request size too large');
        await this.logSecurityEvent('large_request', 'medium', context);
      }

      // Input sanitization
      let sanitizedData = requestData;
      if (requestData) {
        sanitizedData = this.sanitizeInput(requestData);
      }

      // Suspicious activity detection
      if (this.detectSuspiciousActivity(context)) {
        violations.push('Suspicious activity detected');
        await this.logSecurityEvent('suspicious_activity', 'high', context);
      }

      // CSRF protection
      if (this.securityConfig.enableCsrfProtection && !this.validateCsrfToken(context)) {
        violations.push('CSRF validation failed');
        await this.logSecurityEvent('csrf_violation', 'high', context);
      }

      return {
        valid: violations.length === 0,
        sanitizedData,
        violations
      };

    } catch (error) {
      await this.logSecurityEvent('security_check_failed', 'critical', context, {
        error: (error as Error).message
      });
      
      return {
        valid: false,
        violations: ['Security validation failed']
      };
    }
  }

  /**
   * Rate limiting implementation
   */
  async checkRateLimit(context: RequestContext): Promise<RateLimitResult> {
    const identifier = this.getRateLimitIdentifier(context);
    const now = Date.now();
    const windowStart = now - this.securityConfig.rateLimitWindow;
    
    // Clean expired entries
    this.cleanExpiredRateLimits(windowStart);

    const current = this.rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // First request in window
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.securityConfig.rateLimitWindow
      });
      
      return {
        allowed: true,
        remainingRequests: this.securityConfig.rateLimitRequests - 1,
        resetTime: now + this.securityConfig.rateLimitWindow
      };
    }

    if (current.count >= this.securityConfig.rateLimitRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: current.resetTime
      };
    }

    // Increment counter
    current.count++;
    
    return {
      allowed: true,
      remainingRequests: this.securityConfig.rateLimitRequests - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Input validation (basic checks only - SQL injection protection is handled by Supabase)
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Only trim whitespace - Supabase handles SQL injection via parameterized queries
      return input.trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key.trim()] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const activeConnections = this.rateLimitStore.size;
    let rateLimitHits = 0;
    let blockedRequests = 0;

    const now = Date.now();
    const windowStart = now - this.securityConfig.rateLimitWindow;

    for (const [, value] of this.rateLimitStore.entries()) {
      if (value.resetTime > windowStart) {
        if (value.count >= this.securityConfig.rateLimitRequests) {
          blockedRequests++;
        }
        if (value.count > this.securityConfig.rateLimitRequests * 0.8) {
          rateLimitHits++;
        }
      }
    }

    return {
      activeConnections,
      rateLimitHits,
      blockedRequests,
      suspiciousIPs: this.suspiciousIPs.size
    };
  }

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<HealthCheck> {
    const metrics = this.getSecurityMetrics();
    const issues: string[] = [];
    
    const checks = {
      rateLimiting: metrics.blockedRequests < 50,
      suspiciousActivity: metrics.suspiciousIPs < 10,
      memoryUsage: metrics.activeConnections < 1000
    };

    if (!checks.rateLimiting) issues.push('High number of blocked requests');
    if (!checks.suspiciousActivity) issues.push('High suspicious activity');
    if (!checks.memoryUsage) issues.push('High memory usage from connections');

    const allHealthy = Object.values(checks).every(check => check);
    
    return {
      status: allHealthy ? 'healthy' : (issues.length > 1 ? 'unhealthy' : 'degraded'),
      checks,
      issues,
      timestamp: new Date().toISOString(),
      metrics: {
        database: { latencyP95: 0, connectionCount: 1, queryRate: 0 },
        cache: { hitRate: 0, missRate: 0, evictionRate: 0, memoryUsage: 0 },
        api: { requestRate: 0, errorRate: 0, averageResponseTime: 0, p95ResponseTime: 0 },
        security: {
          blockedRequests: metrics.blockedRequests,
          rateLimitHits: metrics.rateLimitHits,
          suspiciousActivity: metrics.suspiciousIPs
        },
        circuitBreakers: {},
        uptime: { seconds: 0, startTime: new Date().toISOString() },
        version: '1.0.0'
      }
    };
  }

  /**
   * Private helper methods
   */
  // Removed dangerous sanitizeString method - Supabase uses parameterized queries
  // which provides proper SQL injection protection. String manipulation can corrupt data.

  private validateRequestSize(data: any): boolean {
    try {
      const size = new Blob([JSON.stringify(data)]).size;
      return size <= this.securityConfig.maxRequestSize;
    } catch {
      return false;
    }
  }

  private detectSuspiciousActivity(context: RequestContext): boolean {
    if (!this.securityConfig.blockSuspiciousActivity) return false;
    
    // Simple suspicious activity detection
    if (context.ipAddress && this.suspiciousIPs.has(context.ipAddress)) {
      return true;
    }

    // Check for suspicious patterns in user agent
    if (context.userAgent) {
      const suspiciousPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(context.userAgent!))) {
        if (context.ipAddress) {
          this.suspiciousIPs.add(context.ipAddress);
        }
        return true;
      }
    }

    return false;
  }

  private validateCsrfToken(context: RequestContext): boolean {
    if (!this.securityConfig.enableCsrfProtection) return true;
    
    // Basic CSRF validation - in production, use proper tokens
    const origin = context.endpoint;
    if (origin && !this.securityConfig.allowedOrigins.some(allowed => 
      origin.includes(allowed.replace(/https?:\/\//, ''))
    )) {
      return false;
    }

    return true;
  }

  private getRateLimitIdentifier(context: RequestContext): string {
    return context.userId || context.ipAddress || 'anonymous';
  }

  private cleanExpiredRateLimits(windowStart: number): void {
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private async logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: RequestContext,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        type: 'security',
        payload: {
          eventType,
          severity,
          blocked: severity === 'high' || severity === 'critical',
          details
        },
        context,
        timestamp: Date.now()
      };

      this.emit(securityEvent);

      // Log to database
      await supabase.rpc('log_security_event', {
        _event_type: eventType,
        _user_id: context.userId || null,
        _ip_address: context.ipAddress || null,
        _user_agent: context.userAgent || null,
        _request_path: context.endpoint || null,
        _request_method: context.method || null,
        _success: false,
        _details: { severity, ...details }
      });

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export const enterpriseSecurity = new EnterpriseSecurity();