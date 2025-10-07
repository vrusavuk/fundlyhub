/**
 * Campaign Edit Validation Schema
 * Used for admin campaign editing with comprehensive validation rules
 */
import { z } from 'zod';

export const campaignEditSchema = z.object({
  // Basic Information
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  summary: z.string()
    .max(500, 'Summary must be less than 500 characters')
    .optional()
    .nullable(),
  
  story_html: z.string()
    .max(50000, 'Story must be less than 50,000 characters')
    .optional()
    .nullable(),
  
  // Financial - with proper coercion
  goal_amount: z.preprocess(
    (val) => {
      if (typeof val === 'string') return parseFloat(val);
      return val;
    },
    z.number()
      .positive('Goal amount must be positive')
      .max(100000000, 'Goal amount is too large')
  ),
  
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .toUpperCase(),
  
  // Categorization
  category_id: z.string().uuid('Invalid category ID').nullable().optional(),
  
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .nullable(),
  
  tags: z.array(z.string()).optional().nullable(),
  
  // Visibility & Status
  visibility: z.enum(['public', 'unlisted', 'private']),
  
  status: z.enum(['draft', 'pending', 'active', 'paused', 'closed', 'ended']),
  
  // Media - with proper URL validation
  cover_image: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url('Must be a valid URL').nullable().optional()
  ),
  video_url: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url('Must be a valid URL').nullable().optional()
  ),
  images: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : val),
    z.array(z.string()).nullable().optional()
  ),
  
  // Timeline
  end_date: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable().optional()
  ),
  
  // Beneficiary
  beneficiary_name: z.string()
    .max(200, 'Beneficiary name must be less than 200 characters')
    .optional()
    .nullable(),
  
  beneficiary_contact: z.string()
    .max(200, 'Beneficiary contact must be less than 200 characters')
    .optional()
    .nullable(),
});

export type CampaignEditData = z.infer<typeof campaignEditSchema>;

// Validation helper
export const validateCampaignEdit = (data: unknown) => {
  return campaignEditSchema.safeParse(data);
};
