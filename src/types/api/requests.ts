/**
 * API request types
 */
import type { FundraiserStatus } from '../domain/fundraiser';

export interface CreateFundraiserData {
  title: string;
  summary?: string;
  description?: string;
  goal_amount: number;
  currency: string;
  category: string;
  cover_image?: File | string;
  location?: string;
  end_date?: string;
  organization_id?: string;
}

export interface UpdateFundraiserData extends Partial<CreateFundraiserData> {
  id: string;
  status?: FundraiserStatus;
}