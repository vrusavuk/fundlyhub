/**
 * Advanced validation engine with async support and typed results
 */
import { z } from 'zod';

export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface AsyncValidator<T> {
  schema: z.ZodSchema<T>;
  asyncValidators?: Array<(data: T) => Promise<ValidationResult<T>>>;
}

export class ValidationEngine {
  /**
   * Validate data with sync and async validators
   */
  static async validate<T>(
    data: any,
    validator: AsyncValidator<T>
  ): Promise<ValidationResult<T>> {
    try {
      // First run sync validation
      const syncResult = validator.schema.safeParse(data);
      
      if (!syncResult.success) {
        return {
          valid: false,
          errors: syncResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        };
      }

      const validatedData = syncResult.data;

      // Run async validators if provided
      if (validator.asyncValidators) {
        for (const asyncValidator of validator.asyncValidators) {
          const asyncResult = await asyncValidator(validatedData);
          if (!asyncResult.valid) {
            return asyncResult;
          }
        }
      }

      return {
        valid: true,
        data: validatedData
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: (error as Error).message,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Fundraiser validation with async checks
   */
  static getFundraiserValidator(): AsyncValidator<any> {
    const schema = z.object({
      title: z.string().trim().min(1).max(100),
      summary: z.string().trim().min(10).max(500),
      story_html: z.string().max(10000).optional(),
      goal_amount: z.number().int().min(1).max(10000000), // Store as cents
      category_id: z.string().uuid().optional(),
      location: z.string().trim().max(100).optional(),
      end_date: z.string().datetime().optional(),
      tags: z.array(z.string().trim().max(50)).max(10).optional(),
      cover_image: z.string().url().optional(),
      video_url: z.string().url().optional(),
      beneficiary_name: z.string().trim().max(100).optional(),
      beneficiary_contact: z.string().trim().max(100).optional()
    });

    const asyncValidators = [
      async (data: any): Promise<ValidationResult<any>> => {
        // Check for duplicate titles by same user
        // This would integrate with your database
        return { valid: true, data };
      },
      async (data: any): Promise<ValidationResult<any>> => {
        // Validate category exists if provided
        if (data.category_id) {
          // Database check would go here
        }
        return { valid: true, data };
      }
    ];

    return { schema, asyncValidators };
  }

  /**
   * Donation validation with money math
   */
  static getDonationValidator(): AsyncValidator<any> {
    const schema = z.object({
      fundraiser_id: z.string().uuid(),
      amount_cents: z.number().int().min(100).max(100000000), // $1 to $1M in cents
      tip_cents: z.number().int().min(0).max(10000000).optional(),
      currency: z.string().length(3).default('USD'),
      is_anonymous: z.boolean().default(false),
      donor_name: z.string().trim().max(100).optional(),
      donor_email: z.string().email().optional(),
      comment: z.string().trim().max(500).optional()
    });

    const asyncValidators = [
      async (data: any): Promise<ValidationResult<any>> => {
        // Validate fundraiser exists and is active
        // Database check would go here
        return { valid: true, data };
      },
      async (data: any): Promise<ValidationResult<any>> => {
        // Validate donation limits per user/IP
        return { valid: true, data };
      }
    ];

    return { schema, asyncValidators };
  }

  /**
   * Search validation
   */
  static getSearchValidator(): AsyncValidator<any> {
    const schema = z.object({
      query: z.string().trim().max(200).optional(),
      category: z.string().uuid().optional(),
      location: z.string().trim().max(100).optional(),
      sort: z.enum(['recent', 'popular', 'goal', 'alphabetical', 'updated']).default('recent'),
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
      direction: z.enum(['forward', 'backward']).default('forward')
    });

    return { schema };
  }

  /**
   * Profile validation
   */
  static getProfileValidator(): AsyncValidator<any> {
    const schema = z.object({
      name: z.string().trim().min(1).max(100),
      bio: z.string().trim().max(500).optional(),
      location: z.string().trim().max(100).optional(),
      website: z.string().url().optional(),
      avatar: z.string().url().optional(),
      social_links: z.record(z.string().url()).optional()
    });

    const asyncValidators = [
      async (data: any): Promise<ValidationResult<any>> => {
        // Check for inappropriate content
        return { valid: true, data };
      }
    ];

    return { schema, asyncValidators };
  }
}