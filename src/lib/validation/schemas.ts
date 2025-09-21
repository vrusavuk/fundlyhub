/**
 * Validation schemas using Zod for type-safe data validation
 * Ensures data integrity and provides runtime type checking
 */
import { z } from 'zod';

// Base schemas
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// User profile schema
export const userProfileSchema = baseEntitySchema.extend({
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  verified: z.boolean().default(false),
});

// Organization schema
export const organizationSchema = baseEntitySchema.extend({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
  location: z.string().max(100, 'Location too long').optional(),
  verified: z.boolean().default(false),
  type: z.enum(['nonprofit', 'charity', 'foundation', 'community']),
});

// Fundraiser category enum
export const fundraiserCategorySchema = z.enum([
  'Medical',
  'Emergency',
  'Education',
  'Community',
  'Animal',
  'Environment',
  'Sports',
  'Arts',
  'Memorial',
  'Other'
]);

// Fundraiser status enum
export const fundraiserStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

// Fundraiser urgency enum
export const fundraiserUrgencySchema = z.enum(['low', 'medium', 'high']);

// Fundraiser schema
export const fundraiserSchema = baseEntitySchema.extend({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().max(300, 'Summary too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  goal_amount: z.number().positive('Goal amount must be positive'),
  raised_amount: z.number().min(0, 'Raised amount cannot be negative').default(0),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  category: fundraiserCategorySchema,
  cover_image: z.string().url().optional(),
  location: z.string().max(100, 'Location too long').optional(),
  status: fundraiserStatusSchema.default('draft'),
  urgency: fundraiserUrgencySchema.optional(),
  end_date: z.string().datetime().optional(),
  user_id: z.string().uuid(),
  organization_id: z.string().uuid().optional(),
});

// Create fundraiser schema (for forms)
export const createFundraiserSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  summary: z.string().max(300, 'Summary too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),
  goal_amount: z.number().positive('Goal amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  category: fundraiserCategorySchema,
  cover_image: z.union([
    z.instanceof(File),
    z.string().url()
  ]).optional(),
  location: z.string().max(100, 'Location too long').optional(),
  end_date: z.string().datetime().optional(),
  organization_id: z.string().uuid().optional(),
});

// Update fundraiser schema
export const updateFundraiserSchema = createFundraiserSchema.partial().extend({
  id: z.string().uuid(),
  status: fundraiserStatusSchema.optional(),
});

// Donation schema
export const donationSchema = baseEntitySchema.extend({
  amount: z.number().positive('Donation amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  message: z.string().max(500, 'Message too long').optional(),
  anonymous: z.boolean().default(false),
  fundraiser_id: z.string().uuid(),
  donor_id: z.string().uuid().optional(),
  donor_name: z.string().max(100, 'Name too long').optional(),
  donor_email: z.string().email().optional(),
  payment_status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  payment_method: z.string().optional(),
});

// Search result schema
export const searchResultSchema = z.object({
  id: z.string(),
  type: z.enum(['campaign', 'user', 'organization']),
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().url().optional(),
  snippet: z.string().optional(),
  link: z.string(),
  relevanceScore: z.number().min(0).max(1).optional(),
  highlightedTitle: z.string().optional(),
  highlightedSubtitle: z.string().optional(),
  matchedFields: z.array(z.string()).optional(),
});

// API response schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    count: z.number(),
    hasMore: z.boolean(),
    page: z.number(),
    limit: z.number(),
  });

// Error schema
export const appErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
});

// Export type inference
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type Fundraiser = z.infer<typeof fundraiserSchema>;
export type CreateFundraiserData = z.infer<typeof createFundraiserSchema>;
export type UpdateFundraiserData = z.infer<typeof updateFundraiserSchema>;
export type Donation = z.infer<typeof donationSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type AppError = z.infer<typeof appErrorSchema>;

// Validation helper functions
export const validateFundraiser = (data: unknown) => {
  return fundraiserSchema.safeParse(data);
};

export const validateCreateFundraiser = (data: unknown) => {
  return createFundraiserSchema.safeParse(data);
};

export const validateSearchResult = (data: unknown) => {
  return searchResultSchema.safeParse(data);
};