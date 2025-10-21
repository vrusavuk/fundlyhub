/**
 * Fundraiser Creation Validation Schemas
 * Enforces character limits and business rules
 */

import { z } from 'zod';

export const fundraiserBasicsSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .refine((val) => val.trim().length > 0, 'Title is required'),
  
  categoryId: z.string().uuid('Please select a valid category'),
  
  goalAmount: z.number()
    .positive('Goal amount must be greater than 0')
    .min(100, 'Goal amount must be at least $100')
    .max(10000000, 'Goal amount cannot exceed $10,000,000'),
  
  type: z.enum(['personal', 'charity']).default('personal'),
  
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  
  passcode: z.string()
    .min(6, 'Passcode must be at least 6 characters')
    .max(50, 'Passcode cannot exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  allowlistEmails: z.string()
    .optional()
    .or(z.literal('')),
});

export const fundraiserStorySchema = z.object({
  summary: z.string()
    .min(10, 'Summary must be at least 10 characters')
    .max(150, 'Summary cannot exceed 150 characters')
    .refine((val) => val.trim().length > 0, 'Summary is required'),
  
  story: z.string()
    .min(150, 'Story must be at least 150 characters')
    .max(1000, 'Story cannot exceed 1000 characters')
    .refine((val) => val.trim().length > 0, 'Story is required'),
});

export const fundraiserDetailsSchema = z.object({
  beneficiaryName: z.string()
    .max(100, 'Beneficiary name cannot exceed 100 characters')
    .optional(),
  
  location: z.string()
    .max(100, 'Location cannot exceed 100 characters')
    .optional(),
  
  coverImage: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  
  endDate: z.string().optional(),
  
  isProject: z.boolean().default(false),
  
  milestones: z.array(z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
    target_amount: z.number().positive('Amount must be positive'),
    currency: z.string().default('USD'),
    due_date: z.string().optional(),
  })).optional(),
});

export const completeFundraiserSchema = fundraiserBasicsSchema
  .merge(fundraiserStorySchema)
  .merge(fundraiserDetailsSchema);

export type FundraiserBasics = z.infer<typeof fundraiserBasicsSchema>;
export type FundraiserStory = z.infer<typeof fundraiserStorySchema>;
export type FundraiserDetails = z.infer<typeof fundraiserDetailsSchema>;
export type CompleteFundraiser = z.infer<typeof completeFundraiserSchema>;
export type Milestone = NonNullable<FundraiserDetails['milestones']>[number];
