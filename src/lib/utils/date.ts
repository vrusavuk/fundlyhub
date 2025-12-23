/**
 * Date Formatting Utilities
 * Single source of truth for date formatting across the application
 */

/**
 * Format a date string for display (e.g., "January 15, 2024")
 * @param dateString - ISO date string or Date object
 * @param options - Optional Intl.DateTimeFormatOptions
 */
export function formatDate(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format a date with time (e.g., "January 15, 2024, 2:30 PM")
 * @param dateString - ISO date string or Date object
 */
export function formatDateTime(dateString: string | Date): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date for short display (e.g., "Jan 15, 2024")
 * @param dateString - ISO date string or Date object
 */
export function formatShortDate(dateString: string | Date): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 days ago", "Just now")
 * @param dateString - ISO date string or Date object
 */
export function formatRelativeTime(dateString: string | Date): string {
  const now = new Date();
  const target = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatShortDate(target);
}

/**
 * Calculate days remaining until a date
 * @param endDate - ISO date string or Date object
 */
export function daysUntil(endDate: string | Date): number {
  const now = new Date();
  const target = new Date(endDate);
  const diffInMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
}

/**
 * Format days remaining with proper grammar
 * @param daysLeft - Number of days remaining
 */
export function formatDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return 'Ended';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}
