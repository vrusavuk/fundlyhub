/**
 * Utility functions for formatting data display
 */

/**
 * Formats currency amounts with proper localization
 * @deprecated Use MoneyMath.format() for precise financial calculations
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  console.warn('formatCurrency is deprecated. Use MoneyMath.format() for precise financial calculations.');
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2, // Changed to 2 for proper money display
    maximumFractionDigits: 2,
  }).format(amount);
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
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return target.toLocaleDateString();
}