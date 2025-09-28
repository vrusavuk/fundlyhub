/**
 * Enhanced Validation Schemas with Security Features
 */
import { z } from 'zod';

// Security-focused validation utilities
const sanitizeString = (str: string): string => {
  return str
    .replace(/['";\\]/g, '') // Remove quotes and escape characters
    .replace(/(--)|(\/\*)|(\*\/)/g, '') // Remove SQL comments
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .trim();
};

const createSanitizedString = (options: { 
  min?: number; 
  max?: number; 
  pattern?: RegExp;
  message?: string;
} = {}) => {
  let schema = z.string();
  
  if (options.min !== undefined) {
    schema = schema.min(options.min, options.message);
  }
  
  if (options.max !== undefined) {
    schema = schema.max(options.max, options.message);
  }
  
  if (options.pattern) {
    schema = schema.regex(options.pattern, options.message);
  }
  
  return schema.transform(sanitizeString);
};

// Enhanced fundraiser validation
export const enhancedFundraiserSchema = z.object({
  title: createSanitizedString({ 
    min: 5, 
    max: 100, 
    message: "Title must be between 5 and 100 characters" 
  }),
  summary: createSanitizedString({ 
    min: 20, 
    max: 500, 
    message: "Summary must be between 20 and 500 characters" 
  }),
  story_html: z.string()
    .max(10000, "Story content too long")
    .optional()
    .transform((val) => {
      // Basic HTML sanitization - in production, use DOMPurify
      if (!val) return val;
      return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }),
  goal_amount: z.number()
    .positive("Goal amount must be positive")
    .max(10000000, "Goal amount cannot exceed $10,000,000")
    .transform((val) => Math.round(val * 100) / 100), // Round to 2 decimal places
  category_id: z.string().uuid("Invalid category ID"),
  end_date: z.string()
    .datetime()
    .optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) > new Date();
    }, "End date must be in the future"),
  beneficiary_name: createSanitizedString({ 
    max: 100, 
    message: "Beneficiary name too long" 
  }).optional(),
  beneficiary_contact: z.string()
    .email("Invalid beneficiary contact email")
    .optional(),
  location: createSanitizedString({ 
    max: 100, 
    message: "Location too long" 
  }).optional(),
  tags: z.array(createSanitizedString({ max: 50 }))
    .max(10, "Too many tags")
    .optional(),
  images: z.array(z.string().url("Invalid image URL"))
    .max(10, "Too many images")
    .optional(),
  video_url: z.string()
    .url("Invalid video URL")
    .optional()
    .refine((url) => {
      if (!url) return true;
      // Only allow trusted video platforms
      const trustedDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'wistia.com'];
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return trustedDomains.some(trusted => domain.includes(trusted));
      } catch {
        return false;
      }
    }, "Video must be from a trusted platform")
});

// Enhanced donation validation
export const enhancedDonationSchema = z.object({
  fundraiser_id: z.string().uuid("Invalid fundraiser ID"),
  amount: z.number()
    .positive("Donation amount must be positive")
    .min(1, "Minimum donation is $1")
    .max(100000, "Maximum donation is $100,000")
    .transform((val) => Math.round(val * 100) / 100),
  tip_amount: z.number()
    .min(0, "Tip amount cannot be negative")
    .max(10000, "Tip amount too high")
    .default(0)
    .transform((val) => Math.round(val * 100) / 100),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .default('USD'),
  donor_name: createSanitizedString({ 
    min: 2, 
    max: 100, 
    message: "Donor name must be between 2 and 100 characters" 
  }).optional(),
  donor_email: z.string()
    .email("Invalid email address")
    .max(255, "Email too long")
    .optional(),
  message: createSanitizedString({ 
    max: 500, 
    message: "Message too long" 
  }).optional(),
  is_anonymous: z.boolean().default(false),
  payment_method: z.enum(['credit_card', 'paypal', 'bank_transfer', 'crypto'])
    .default('credit_card')
});

// Enhanced profile validation
export const enhancedProfileSchema = z.object({
  name: createSanitizedString({ 
    min: 2, 
    max: 100, 
    message: "Name must be between 2 and 100 characters" 
  }),
  bio: createSanitizedString({ 
    max: 1000, 
    message: "Bio too long" 
  }).optional(),
  avatar: z.string()
    .url("Invalid avatar URL")
    .optional()
    .refine((url) => {
      if (!url) return true;
      // Validate image file extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some(ext => url.toLowerCase().includes(ext));
    }, "Avatar must be a valid image file"),
  website: z.string()
    .url("Invalid website URL")
    .max(255, "Website URL too long")
    .optional()
    .refine((url) => {
      if (!url) return true;
      // Basic URL security check
      try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    }, "Website must use HTTP or HTTPS"),
  location: createSanitizedString({ 
    max: 100, 
    message: "Location too long" 
  }).optional(),
  social_links: z.object({
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional()
  }).optional().refine((links) => {
    if (!links) return true;
    // Validate social media URLs
    const validators = {
      twitter: (url: string) => url.includes('twitter.com') || url.includes('x.com'),
      facebook: (url: string) => url.includes('facebook.com'),
      instagram: (url: string) => url.includes('instagram.com'),
      linkedin: (url: string) => url.includes('linkedin.com')
    };
    
    for (const [platform, url] of Object.entries(links)) {
      if (url && !validators[platform as keyof typeof validators]?.(url)) {
        return false;
      }
    }
    return true;
  }, "Invalid social media URLs")
});

// Enhanced comment validation
export const enhancedCommentSchema = z.object({
  fundraiser_id: z.string().uuid("Invalid fundraiser ID"),
  content: createSanitizedString({ 
    min: 1, 
    max: 1000, 
    message: "Comment must be between 1 and 1000 characters" 
  }),
  parent_id: z.string().uuid().optional() // For threaded comments
});

// Enhanced organization validation
export const enhancedOrganizationSchema = z.object({
  legal_name: createSanitizedString({ 
    min: 2, 
    max: 200, 
    message: "Legal name must be between 2 and 200 characters" 
  }),
  dba_name: createSanitizedString({ 
    max: 200, 
    message: "DBA name too long" 
  }).optional(),
  ein: z.string()
    .regex(/^\d{2}-\d{7}$/, "EIN must be in format XX-XXXXXXX")
    .optional(),
  website: z.string()
    .url("Invalid website URL")
    .max(255, "Website URL too long")
    .optional(),
  address: z.object({
    street: createSanitizedString({ max: 100 }),
    city: createSanitizedString({ max: 50 }),
    state: createSanitizedString({ max: 50 }),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
    country: z.string().length(2, "Country must be 2-letter code")
  }).optional(),
  categories: z.array(z.string().uuid())
    .max(5, "Too many categories")
    .optional()
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  window: z.number().positive(),
  limit: z.number().positive()
});

// Search validation
export const enhancedSearchSchema = z.object({
  query: createSanitizedString({ 
    min: 1, 
    max: 100, 
    message: "Search query must be between 1 and 100 characters" 
  }),
  category: z.string().uuid().optional(),
  location: createSanitizedString({ max: 100 }).optional(),
  sort: z.enum(['recent', 'popular', 'goal', 'raised']).default('recent'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  filters: z.object({
    min_goal: z.number().positive().optional(),
    max_goal: z.number().positive().optional(),
    status: z.enum(['active', 'completed', 'draft']).optional(),
    has_image: z.boolean().optional(),
    has_video: z.boolean().optional()
  }).optional()
});

// Security event validation
export const securityEventSchema = z.object({
  event_type: z.enum([
    'login_attempt',
    'login_success',
    'login_failure',
    'password_reset',
    'account_locked',
    'permission_denied',
    'rate_limit_exceeded',
    'suspicious_activity',
    'data_export',
    'admin_action'
  ]),
  user_id: z.string().uuid().optional(),
  ip_address: z.string().ip().optional(),
  user_agent: createSanitizedString({ max: 500 }).optional(),
  details: z.record(z.any()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

// Export validation helper functions
export const validateFundraiser = (data: unknown) => enhancedFundraiserSchema.parse(data);
export const validateDonation = (data: unknown) => enhancedDonationSchema.parse(data);
export const validateProfile = (data: unknown) => enhancedProfileSchema.parse(data);
export const validateComment = (data: unknown) => enhancedCommentSchema.parse(data);
export const validateOrganization = (data: unknown) => enhancedOrganizationSchema.parse(data);
export const validateSearch = (data: unknown) => enhancedSearchSchema.parse(data);
export const validateSecurityEvent = (data: unknown) => securityEventSchema.parse(data);

// Validation middleware helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
      }
      throw error;
    }
  };
};