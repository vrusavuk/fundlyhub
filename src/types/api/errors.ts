/**
 * API error types
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}