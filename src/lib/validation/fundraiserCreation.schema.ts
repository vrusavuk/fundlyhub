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
});

export const completeFundraiserSchema = fundraiserBasicsSchema
  .merge(fundraiserStorySchema)
  .merge(fundraiserDetailsSchema);

export type FundraiserBasics = z.infer<typeof fundraiserBasicsSchema>;
export type FundraiserStory = z.infer<typeof fundraiserStorySchema>;
export type FundraiserDetails = z.infer<typeof fundraiserDetailsSchema>;
export type CompleteFundraiser = z.infer<typeof completeFundraiserSchema>;
