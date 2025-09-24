/**
 * Filter types and constants for campaign filtering
 */
import type { Category } from '@/types/category';

export interface FilterState {
  categories: string[];
  location: string;
  locationInput: string;
  timePeriod: string;
  nonprofitsOnly: boolean;
  closeToGoal: boolean;
}

export interface CampaignFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount: number;
  initialCategory?: string;
  categories: Category[];
}

export const LOCATIONS = [
  'All locations',
  'United States',
  'Canada', 
  'United Kingdom',
  'Australia',
  'Near me'
];

export const TIME_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
  { value: '12m', label: 'Past 12 months' }
];