/**
 * Enterprise-grade slug generation with collision handling
 * Ensures unique slugs with proper retry mechanisms
 */

export interface SlugOptions {
  maxLength?: number;
  separator?: string;
  lowercase?: boolean;
  allowUnicode?: boolean;
  retryAttempts?: number;
}

export class SlugGenerator {
  private readonly DEFAULT_OPTIONS: Required<SlugOptions> = {
    maxLength: 100,
    separator: '-',
    lowercase: true,
    allowUnicode: false,
    retryAttempts: 3
  };

  /**
   * Generate a unique slug with collision handling
   */
  async generateUniqueSlug(
    title: string,
    checkUniqueness: (slug: string) => Promise<boolean>,
    options: SlugOptions = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const baseSlug = this.generateSlug(title, opts);
    
    // First try the base slug
    if (await checkUniqueness(baseSlug)) {
      return baseSlug;
    }
    
    // Try with timestamp
    const timestampSlug = `${baseSlug}${opts.separator}${Date.now()}`;
    if (await checkUniqueness(timestampSlug)) {
      return timestampSlug;
    }
    
    // Try with short hash
    for (let i = 1; i <= opts.retryAttempts; i++) {
      const hash = this.generateShortHash(baseSlug + i);
      const hashSlug = `${baseSlug}${opts.separator}${hash}`;
      
      if (await checkUniqueness(hashSlug)) {
        return hashSlug;
      }
    }
    
    // Final fallback with UUID
    const uuid = this.generateShortUuid();
    return `${baseSlug}${opts.separator}${uuid}`;
  }

  /**
   * Generate base slug from title
   */
  private generateSlug(title: string, options: Required<SlugOptions>): string {
    let slug = title.trim();
    
    if (options.lowercase) {
      slug = slug.toLowerCase();
    }
    
    if (!options.allowUnicode) {
      // Convert unicode characters to ASCII equivalents
      slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    // Replace non-alphanumeric characters with separator
    slug = slug.replace(/[^a-zA-Z0-9\u00C0-\u017F]+/g, options.separator);
    
    // Remove leading/trailing separators
    slug = slug.replace(new RegExp(`^${options.separator}+|${options.separator}+$`, 'g'), '');
    
    // Replace multiple consecutive separators with single separator
    slug = slug.replace(new RegExp(`${options.separator}+`, 'g'), options.separator);
    
    // Truncate to max length
    if (slug.length > options.maxLength) {
      slug = slug.substring(0, options.maxLength);
      // Remove trailing separator if truncation created one
      slug = slug.replace(new RegExp(`${options.separator}+$`), '');
    }
    
    return slug || 'untitled';
  }

  /**
   * Generate short hash for collision resolution
   */
  private generateShortHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  /**
   * Generate short UUID for final fallback
   */
  private generateShortUuid(): string {
    return Math.random().toString(36).substring(2, 8) + 
           Math.random().toString(36).substring(2, 8);
  }

  /**
   * Validate slug format
   */
  isValidSlug(slug: string, options: SlugOptions = {}): boolean {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    if (!slug || slug.length === 0) {
      return false;
    }
    
    if (slug.length > opts.maxLength) {
      return false;
    }
    
    // Check for invalid characters
    const validPattern = opts.allowUnicode 
      ? new RegExp(`^[a-zA-Z0-9\u00C0-\u017F${opts.separator}]+$`)
      : new RegExp(`^[a-zA-Z0-9${opts.separator}]+$`);
    
    if (!validPattern.test(slug)) {
      return false;
    }
    
    // Check for leading/trailing separators
    if (slug.startsWith(opts.separator) || slug.endsWith(opts.separator)) {
      return false;
    }
    
    // Check for consecutive separators
    if (slug.includes(opts.separator + opts.separator)) {
      return false;
    }
    
    return true;
  }
}