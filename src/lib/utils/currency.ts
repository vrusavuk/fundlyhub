/**
 * Currency Formatting Utilities
 * Single source of truth for currency formatting across the application
 */

/**
 * Format a number as currency
 * @param amount - The amount in dollars (not cents)
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale code (default: 'en-US')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cents as currency (for Stripe amounts)
 * @param cents - The amount in cents
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale code (default: 'en-US')
 */
export function formatCentsAsCurrency(
  cents: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return formatCurrency(cents / 100, currency, locale);
}

/**
 * Parse a currency string to a number
 * @param value - String like "$1,234.56" or "1234.56"
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format a number as a compact currency (e.g., $1.2K, $3.5M)
 * @param amount - The amount in dollars
 * @param currency - ISO 4217 currency code (default: 'USD')
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}
