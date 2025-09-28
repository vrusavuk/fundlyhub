/**
 * Enterprise audit logging with PII masking and security compliance
 */

export interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  metadata: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MaskingOptions {
  maskEmail?: boolean;
  maskPhone?: boolean;
  maskCreditCard?: boolean;
  maskSSN?: boolean;
  customPatterns?: Array<{
    pattern: RegExp;
    replacement: string;
  }>;
}

export class AuditLogger {
  private readonly DEFAULT_MASKING: Required<MaskingOptions> = {
    maskEmail: true,
    maskPhone: true,
    maskCreditCard: true,
    maskSSN: true,
    customPatterns: []
  };

  private readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g
  };

  /**
   * Mask PII data in audit metadata
   */
  maskPII(data: any, options: MaskingOptions = {}): any {
    const opts = { ...this.DEFAULT_MASKING, ...options };
    
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Deep clone to avoid modifying original
    const masked = JSON.parse(JSON.stringify(data));
    
    return this.recursiveMask(masked, opts);
  }

  /**
   * Create audit log entry with proper masking
   */
  createAuditEntry(
    action: string,
    resourceType: string,
    metadata: Record<string, any>,
    options: {
      resourceId?: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      maskingOptions?: MaskingOptions;
    } = {}
  ): AuditLogEntry {
    const maskedMetadata = this.maskPII(metadata, options.maskingOptions);
    
    return {
      action,
      resourceType,
      resourceId: options.resourceId,
      userId: options.userId,
      metadata: maskedMetadata,
      timestamp: new Date().toISOString(),
      ipAddress: options.ipAddress,
      userAgent: this.maskUserAgent(options.userAgent)
    };
  }

  /**
   * Recursively mask PII in nested objects
   */
  private recursiveMask(obj: any, options: Required<MaskingOptions>): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.recursiveMask(item, options));
    }
    
    if (obj && typeof obj === 'object') {
      const masked: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Skip masking for certain safe fields
        if (this.isSafeField(key)) {
          masked[key] = value;
          continue;
        }
        
        if (typeof value === 'string') {
          masked[key] = this.maskString(value, options);
        } else {
          masked[key] = this.recursiveMask(value, options);
        }
      }
      
      return masked;
    }
    
    return obj;
  }

  /**
   * Mask PII patterns in strings
   */
  private maskString(str: string, options: Required<MaskingOptions>): string {
    let masked = str;
    
    if (options.maskEmail) {
      masked = masked.replace(this.PII_PATTERNS.email, (match) => {
        const [local, domain] = match.split('@');
        const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1);
        return `${maskedLocal}@${domain}`;
      });
    }
    
    if (options.maskPhone) {
      masked = masked.replace(this.PII_PATTERNS.phone, 'XXX-XXX-XXXX');
    }
    
    if (options.maskCreditCard) {
      masked = masked.replace(this.PII_PATTERNS.creditCard, (match) => {
        return '*'.repeat(match.length - 4) + match.slice(-4);
      });
    }
    
    if (options.maskSSN) {
      masked = masked.replace(this.PII_PATTERNS.ssn, 'XXX-XX-XXXX');
    }
    
    // Apply custom patterns
    for (const { pattern, replacement } of options.customPatterns) {
      masked = masked.replace(pattern, replacement);
    }
    
    return masked;
  }

  /**
   * Check if field is safe from masking
   */
  private isSafeField(fieldName: string): boolean {
    const safeFields = [
      'id', 'uuid', 'slug', 'status', 'type', 'category',
      'created_at', 'updated_at', 'timestamp', 'version',
      'count', 'total', 'amount', 'currency', 'goal_amount',
      'endpoint', 'method', 'outcome', 'error_code'
    ];
    
    return safeFields.includes(fieldName.toLowerCase()) ||
           fieldName.endsWith('_id') ||
           fieldName.endsWith('_at') ||
           fieldName.endsWith('_count');
  }

  /**
   * Mask user agent to remove potentially identifying information
   */
  private maskUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    
    // Keep only browser and version, remove system info
    const simplified = userAgent.replace(
      /\(([^)]+)\)/g, // Remove content in parentheses
      '(system_info_masked)'
    );
    
    return simplified;
  }

  /**
   * Validate audit entry before logging
   */
  validateAuditEntry(entry: AuditLogEntry): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!entry.action || entry.action.trim() === '') {
      errors.push('Action is required');
    }
    
    if (!entry.resourceType || entry.resourceType.trim() === '') {
      errors.push('Resource type is required');
    }
    
    if (!entry.timestamp) {
      errors.push('Timestamp is required');
    } else {
      try {
        new Date(entry.timestamp);
      } catch {
        errors.push('Invalid timestamp format');
      }
    }
    
    if (entry.metadata && typeof entry.metadata !== 'object') {
      errors.push('Metadata must be an object');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
