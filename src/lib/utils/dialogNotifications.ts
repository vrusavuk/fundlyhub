import { FieldErrors } from "react-hook-form";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Format validation errors from react-hook-form into a readable string
 */
export function formatValidationErrors(errors: FieldErrors): string {
  const errorMessages = Object.entries(errors)
    .map(([field, error]) => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
      return `${fieldName}: ${error?.message || 'Invalid value'}`;
    })
    .join('; ');
  
  return errorMessages || 'Please check your inputs and try again.';
}

/**
 * Extract meaningful error message from Supabase errors
 */
export function extractSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle PostgrestError (database errors)
  if (error.code) {
    const postgrestError = error as PostgrestError;
    
    // RLS policy violations
    if (postgrestError.code === 'PGRST301' || postgrestError.code === '42501') {
      return 'You do not have permission to perform this action. Please contact an administrator.';
    }
    
    // Constraint violations
    if (postgrestError.code === '23505') {
      return 'A record with this information already exists.';
    }
    
    if (postgrestError.code === '23503') {
      return 'This operation references data that does not exist.';
    }
    
    // Return the hint or message
    return postgrestError.hint || postgrestError.message || 'A database error occurred';
  }

  // Handle Auth errors
  if (error.status === 401 || error.status === 403) {
    return 'Authentication failed. Please log in again.';
  }

  if (error.status === 422) {
    return 'The provided data is invalid. Please check your inputs.';
  }

  // Network errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return the error message if available
  return error.message || error.error_description || 'An unexpected error occurred';
}

/**
 * Determine the severity level of an error
 */
export function getErrorSeverity(error: any): 'error' | 'warning' | 'info' {
  if (!error) return 'info';
  
  // Permission errors are usually critical
  if (error.code === 'PGRST301' || error.code === '42501' || error.status === 403) {
    return 'error';
  }
  
  // Network errors might be temporary
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'warning';
  }
  
  // Validation errors
  if (error.status === 422 || error.code === '23505' || error.code === '23503') {
    return 'error';
  }
  
  return 'error';
}

/**
 * Determine if showing a retry action makes sense for this error
 */
export function shouldShowRetry(error: any): boolean {
  if (!error) return false;
  
  // Network errors can be retried
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return true;
  }
  
  // Timeout errors
  if (error.code === 'PGRST000' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Don't retry permission errors or validation errors
  if (
    error.code === 'PGRST301' || 
    error.code === '42501' || 
    error.status === 403 ||
    error.code === '23505' ||
    error.code === '23503'
  ) {
    return false;
  }
  
  // Default to allowing retry for unknown errors
  return true;
}

/**
 * Get a user-friendly title for an error type
 */
export function getErrorTitle(error: any): string {
  if (!error) return 'Error';
  
  if (error.code === 'PGRST301' || error.code === '42501' || error.status === 403) {
    return 'Permission Denied';
  }
  
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Connection Error';
  }
  
  if (error.code === '23505') {
    return 'Duplicate Entry';
  }
  
  if (error.code === '23503') {
    return 'Invalid Reference';
  }
  
  if (error.status === 422) {
    return 'Validation Error';
  }
  
  return 'Error';
}
