/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 'FORBIDDEN', 403, true);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0, true);
  }
}

// Error handling utilities
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('fetch')) {
      return new NetworkError('Failed to connect to server');
    }
    
    if (error.message.includes('validation')) {
      return new ValidationError(error.message);
    }
    
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, false);
  }

  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
};

// Error logging utility
export const logError = (error: AppError, context?: Record<string, any>) => {
  const errorLog = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    details: error.details,
    context,
    stack: error.stack,
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service (e.g., Sentry, LogRocket)
    console.error('Error logged:', errorLog);
  } else {
    console.error('Development Error:', errorLog);
  }
};

// Error boundary helper
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// HTTP status code helpers
export const isClientError = (statusCode: number): boolean => {
  return statusCode >= 400 && statusCode < 500;
};

export const isServerError = (statusCode: number): boolean => {
  return statusCode >= 500 && statusCode < 600;
};

// Error recovery utilities
export const createRetryableError = (
  message: string,
  originalError?: Error,
  retryCount: number = 0
): AppError => {
  return new AppError(
    message,
    'RETRYABLE_ERROR',
    500,
    true,
    { originalError: originalError?.message, retryCount }
  );
};

export const shouldRetry = (error: AppError, maxRetries: number = 3): boolean => {
  if (!error.isOperational) return false;
  if (isClientError(error.statusCode)) return false;
  
  const retryCount = error.details?.retryCount || 0;
  return retryCount < maxRetries;
};