import { AuthError } from '@supabase/supabase-js';

export const parseSupabaseAuthError = (error: AuthError | null): string => {
  if (!error) return 'An unexpected error occurred';

  const errorMessage = error.message.toLowerCase();

  // Email-related errors
  if (errorMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (errorMessage.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  if (errorMessage.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Password-related errors
  if (errorMessage.includes('password') && errorMessage.includes('should be at least')) {
    const match = errorMessage.match(/at least (\d+) characters/);
    const minLength = match ? match[1] : '8';
    return `Password must be at least ${minLength} characters long.`;
  }

  if (errorMessage.includes('password is too weak') || errorMessage.includes('password does not meet requirements')) {
    return 'Password does not meet security requirements. Please check the criteria below.';
  }

  // Rate limiting
  if (errorMessage.includes('email rate limit exceeded')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // OAuth errors
  if (errorMessage.includes('oauth')) {
    return 'Social login failed. Please try again or use email/password.';
  }

  // Default fallback
  return error.message || 'An error occurred during authentication. Please try again.';
};
