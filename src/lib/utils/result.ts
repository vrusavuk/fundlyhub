/**
 * Result Type Pattern
 * Railway-oriented programming for type-safe error handling
 * 
 * Benefits:
 * - Explicit error handling (no exceptions)
 * - Type-safe success/failure paths
 * - Composable error handling
 * - Forces handling of all cases
 * 
 * Usage:
 * ```typescript
 * async function createFundraiser(input: CreateInput): Promise<Result<Fundraiser>> {
 *   if (!input.title) {
 *     return failure({ code: 'VALIDATION_ERROR', message: 'Title required' });
 *   }
 *   
 *   const fundraiser = await db.create(input);
 *   return success(fundraiser);
 * }
 * 
 * const result = await createFundraiser(input);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

/**
 * Standard error structure
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
  stack?: string;
}

/**
 * Result type - either Success or Failure
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E = AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Create AppError from Error object
 */
export function errorFromException(
  error: Error,
  code: string = 'UNKNOWN_ERROR'
): AppError {
  return {
    code,
    message: error.message,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };
}

/**
 * Create AppError from message
 */
export function errorFromMessage(
  code: string,
  message: string,
  details?: Record<string, any>
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type guard for success results
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard for failure results
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Map success data to new type
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return success(mapper(result.data));
  }
  return result as Result<U, E>;
}

/**
 * Chain async operations (flatMap)
 */
export async function chainResult<T, U, E>(
  result: Result<T, E>,
  next: (data: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.success) {
    return await next(result.data);
  }
  return result as Result<U, E>;
}

/**
 * Unwrap result or throw error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(
    'error' in result && typeof result.error === 'object' && result.error !== null && 'message' in result.error
      ? String(result.error.message)
      : 'Result unwrap failed'
  );
}

/**
 * Unwrap result or return default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Combine multiple results into one
 * All must succeed or returns first error
 */
export function combineResults<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const data: T[] = [];
  
  for (const result of results) {
    if (result.success) {
      data.push(result.data);
    } else {
      return result as Result<T[], E>;
    }
  }
  
  return success(data);
}

/**
 * Try-catch wrapper that returns Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorCode: string = 'OPERATION_FAILED'
): Promise<Result<T>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(errorFromException(error as Error, errorCode));
  }
}

/**
 * Synchronous try-catch wrapper
 */
export function tryCatchSync<T>(
  fn: () => T,
  errorCode: string = 'OPERATION_FAILED'
): Result<T> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    return failure(errorFromException(error as Error, errorCode));
  }
}

/**
 * Pattern matching for Result type
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    success: (data: T) => U;
    failure: (error: E) => U;
  }
): U {
  if (result.success) {
    return handlers.success(result.data);
  }
  return handlers.failure((result as { success: false; error: E }).error);
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Database errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
