/**
 * Utility functions for formatting data display
 * @deprecated Import directly from specific utilities:
 * - Currency: import { formatCurrency } from '@/lib/utils/currency'
 * - Dates: import { formatDate, formatRelativeTime } from '@/lib/utils/date'
 */

import { logger } from '@/lib/services/logger.service';
import { formatCurrency as currencyFormat } from './currency';

/**
 * Formats currency amounts with proper localization
 * @deprecated Use formatCurrency from '@/lib/utils/currency' instead
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  logger.warn('formatCurrency from formatters.ts is deprecated. Use formatCurrency from @/lib/utils/currency instead.', {
    componentName: 'formatters',
    operationName: 'formatCurrency',
  });
  return currencyFormat(amount, currency, locale);
}

/**
 * Formats progress percentage
 */
export function formatProgress(raised: number, goal: number): number {
  return Math.min((raised / goal) * 100, 100);
}

/**
 * Formats donation count with proper pluralization
 */
export function formatDonorCount(count: number): string {
  return `${count} ${count === 1 ? 'backer' : 'backers'}`;
}

/**
 * Formats days remaining
 */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return 'Ended';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Formats relative time (e.g., "2 days ago")
 * @deprecated Use formatRelativeTime from '@/lib/utils/date' instead
 */
export { formatRelativeTime } from './date';