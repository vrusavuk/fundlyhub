/**
 * Enterprise Security Middleware - Request validation, rate limiting, and monitoring
 */
import { supabase } from '@/integrations/supabase/client';

export interface SecurityConfig {
  rateLimitRequests: number;
  rateLimitWindow: number; // in milliseconds
  maxRequestSize: number; // in bytes
  allowedOrigins: string[];
  enableCsrfProtection: boolean;
}

export interface SecurityContext {
  requestId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

class SecurityMiddleware {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private config: SecurityConfig = {
    rateLimitRequests: 100,
    rateLimitWindow: 60000, // 1 minute
    maxRequestSize: 10485760, // 10MB
    allowedOrigins: [
      'https://sgcaqrtnxqhrrqzxmupa.supabase.co',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    enableCsrfProtection: true
  };

  /**
   * Rate limiting based on IP address or user ID
   */
  async checkRateLimit(identifier: string): Promise<{ allowed: boolean; remainingRequests: number }> {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    // Clean expired entries
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        this.rateLimitStore.delete(key);
      }
    }

    const current = this.rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // First request in window or expired window
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return { allowed: true, remainingRequests: this.config.rateLimitRequests - 1 };
    }

    if (current.count >= this.config.rateLimitRequests) {
      // Rate limit exceeded
      await this.logSecurityEvent('rate_limit_exceeded', {
        identifier,
        requests: current.count,
        window: this.config.rateLimitWindow
      });
      
      return { allowed: false, remainingRequests: 0 };
    }

    // Increment counter
    current.count++;
    return { 
      allowed: true, 
      remainingRequests: this.config.rateLimitRequests - current.count 
    };
  }

  /**
   * Validate request size and content
   */
  validateRequest(request: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  }): { valid: boolean; error?: string } {
    // Check request size
    const bodySize = request.body ? new Blob([request.body]).size : 0;
    if (bodySize > this.config.maxRequestSize) {
      return {
        valid: false,
        error: `Request body too large: ${bodySize} bytes (max: ${this.config.maxRequestSize})`
      };
    }

    // Check content type for POST/PUT requests
    if (request.method && ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
      const contentType = request.headers?.['content-type'] || request.headers?.['Content-Type'];
      if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
        return {
          valid: false,
          error: 'Invalid content type for write operation'
        };
      }
    }

    return { valid: true };
  }

  /**
   * CSRF protection
   */
  validateCsrfToken(token?: string, origin?: string): boolean {
    if (!this.config.enableCsrfProtection) return true;
    
    // Check origin
    if (origin && !this.config.allowedOrigins.includes(origin)) {
      return false;
    }

    // For now, basic CSRF check - in production, use proper CSRF tokens
    return true;
  }

  /**
   * Input validation (basic checks only)
   * Note: SQL injection protection is handled by Supabase's parameterized queries.
   * Do not strip SQL keywords as this can corrupt legitimate data.
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Only trim whitespace - do not remove characters that might be legitimate
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
   * Log security events to database
   */
  async logSecurityEvent(
    eventType: string, 
    details: Record<string, any> = {},
    context?: SecurityContext
  ): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        _event_type: eventType,
        _user_id: context?.userId || null,
        _ip_address: context?.ipAddress || null,
        _user_agent: context?.userAgent || null,
        _request_path: context?.path || null,
        _request_method: context?.method || null,
        _success: details.success !== false,
        _details: details
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    activeConnections: number;
    rateLimitHits: number;
    blockedRequests: number;
  } {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    let rateLimitHits = 0;
    let blockedRequests = 0;
    
    for (const [, value] of this.rateLimitStore.entries()) {
      if (value.resetTime > windowStart) {
        if (value.count >= this.config.rateLimitRequests) {
          blockedRequests++;
        }
        if (value.count > this.config.rateLimitRequests * 0.8) {
          rateLimitHits++;
        }
      }
    }

    return {
      activeConnections: this.rateLimitStore.size,
      rateLimitHits,
      blockedRequests
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const securityMiddleware = new SecurityMiddleware();