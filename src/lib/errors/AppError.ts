/**
 * Enhanced application error classes
 * Provides structured error handling with user-friendly messages
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  resource?: string;
  timestamp?: Date;
  additionalInfo?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: Record<string, any>;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    context?: ErrorContext,
    retryable: boolean = false
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.context = context;
    this.retryable = retryable;

    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested item could not be found.';
      case ErrorType.SERVER:
        return 'A server error occurred. Please try again later.';
      case ErrorType.CLIENT:
        return 'An error occurred. Please refresh the page and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      code: this.code,
      statusCode: this.statusCode,
      type: this.type,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      timestamp: this.timestamp,
      details: this.details,
      stack: this.stack,
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message, 
      'VALIDATION_ERROR', 
      400, 
      true, 
      details,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      'Please correct the highlighted fields and try again.'
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(
      message, 
      'NOT_FOUND', 
      404, 
      true, 
      undefined,
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      'The item you are looking for could not be found.'
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(
      message, 
      'UNAUTHORIZED', 
      401, 
      true, 
      undefined,
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      'Your session has expired. Please sign in again.'
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(
      message, 
      'FORBIDDEN', 
      403, 
      true, 
      undefined,
      ErrorType.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      'You do not have permission to access this resource.'
    );
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(
      message, 
      'NETWORK_ERROR', 
      0, 
      true, 
      undefined,
      ErrorType.NETWORK,
      ErrorSeverity.MEDIUM,
      'Network connection failed. Please check your internet and try again.',
      undefined,
      true
    );
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
    
    return new AppError(
      error.message, 
      'UNKNOWN_ERROR', 
      500, 
      false, 
      undefined,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM
    );
  }

  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    false,
    undefined,
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM
  );
};

// Enhanced error utilities
export const shouldLogError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL;
  }
  return true;
};

export const isRetryableError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.retryable;
  }
  // Network errors are generally retryable
  return error.name === 'NetworkError' || error.message.includes('network');
};

export const getErrorSeverity = (error: Error): ErrorSeverity => {
  if (error instanceof AppError) {
    return error.severity;
  }
  return ErrorSeverity.MEDIUM;
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