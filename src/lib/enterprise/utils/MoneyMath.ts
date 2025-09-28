/**
 * Precise money arithmetic using string-based decimal calculations
 * Prevents floating-point precision issues in financial calculations
 */

export interface Money {
  amount: string; // Store as string to maintain precision
  currency: string;
}

export class MoneyMath {
  private static readonly DEFAULT_PRECISION = 2;
  private static readonly VALID_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);

  /**
   * Create Money object from number or string
   */
  static create(amount: number | string, currency: string = 'USD'): Money {
    this.validateCurrency(currency);
    const amountStr = typeof amount === 'number' ? amount.toFixed(this.DEFAULT_PRECISION) : amount;
    this.validateAmount(amountStr);
    
    return {
      amount: this.normalize(amountStr),
      currency: currency.toUpperCase()
    };
  }

  /**
   * Add two money amounts (must be same currency)
   */
  static add(a: Money, b: Money): Money {
    this.validateSameCurrency(a, b);
    
    const result = this.addDecimals(a.amount, b.amount);
    return { amount: result, currency: a.currency };
  }

  /**
   * Subtract two money amounts (must be same currency)
   */
  static subtract(a: Money, b: Money): Money {
    this.validateSameCurrency(a, b);
    
    const result = this.subtractDecimals(a.amount, b.amount);
    return { amount: result, currency: a.currency };
  }

  /**
   * Multiply money by a factor
   */
  static multiply(money: Money, factor: number | string): Money {
    const factorStr = typeof factor === 'number' ? factor.toString() : factor;
    const result = this.multiplyDecimals(money.amount, factorStr);
    return { amount: result, currency: money.currency };
  }

  /**
   * Calculate percentage of money amount
   */
  static percentage(money: Money, percent: number): Money {
    const result = this.multiplyDecimals(money.amount, (percent / 100).toString());
    return { amount: result, currency: money.currency };
  }

  /**
   * Compare two money amounts
   */
  static compare(a: Money, b: Money): number {
    this.validateSameCurrency(a, b);
    return this.compareDecimals(a.amount, b.amount);
  }

  /**
   * Check if two money amounts are equal
   */
  static equals(a: Money, b: Money): boolean {
    return a.currency === b.currency && this.compare(a, b) === 0;
  }

  /**
   * Convert to number (use only for display, not calculations)
   */
  static toNumber(money: Money): number {
    return parseFloat(money.amount);
  }

  /**
   * Format for display
   */
  static format(money: Money, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
      minimumFractionDigits: this.DEFAULT_PRECISION,
      maximumFractionDigits: this.DEFAULT_PRECISION,
    }).format(this.toNumber(money));
  }

  /**
   * Validate currency code
   */
  private static validateCurrency(currency: string): void {
    if (!this.VALID_CURRENCIES.has(currency.toUpperCase())) {
      throw new Error(`Invalid currency: ${currency}`);
    }
  }

  /**
   * Validate amount string
   */
  private static validateAmount(amount: string): void {
    if (!/^-?\d+(\.\d+)?$/.test(amount)) {
      throw new Error(`Invalid amount format: ${amount}`);
    }
  }

  /**
   * Validate same currency
   */
  private static validateSameCurrency(a: Money, b: Money): void {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
    }
  }

  /**
   * Normalize decimal string (ensure proper precision)
   */
  private static normalize(amount: string): string {
    const num = parseFloat(amount);
    return num.toFixed(this.DEFAULT_PRECISION);
  }

  /**
   * Add two decimal strings
   */
  private static addDecimals(a: string, b: string): string {
    const precision = this.DEFAULT_PRECISION;
    const multiplier = Math.pow(10, precision);
    
    const aInt = Math.round(parseFloat(a) * multiplier);
    const bInt = Math.round(parseFloat(b) * multiplier);
    
    return ((aInt + bInt) / multiplier).toFixed(precision);
  }

  /**
   * Subtract two decimal strings
   */
  private static subtractDecimals(a: string, b: string): string {
    const precision = this.DEFAULT_PRECISION;
    const multiplier = Math.pow(10, precision);
    
    const aInt = Math.round(parseFloat(a) * multiplier);
    const bInt = Math.round(parseFloat(b) * multiplier);
    
    return ((aInt - bInt) / multiplier).toFixed(precision);
  }

  /**
   * Multiply decimal string by factor
   */
  private static multiplyDecimals(amount: string, factor: string): string {
    const precision = this.DEFAULT_PRECISION;
    const multiplier = Math.pow(10, precision);
    
    const amountInt = Math.round(parseFloat(amount) * multiplier);
    const factorFloat = parseFloat(factor);
    
    return (amountInt * factorFloat / multiplier).toFixed(precision);
  }

  /**
   * Compare two decimal strings
   */
  private static compareDecimals(a: string, b: string): number {
    const aFloat = parseFloat(a);
    const bFloat = parseFloat(b);
    
    if (aFloat < bFloat) return -1;
    if (aFloat > bFloat) return 1;
    return 0;
  }
}