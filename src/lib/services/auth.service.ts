/**
 * Authentication Service
 * Handles all authentication-related business logic
 * Single Responsibility: User authentication operations
 */

import { supabase } from '@/integrations/supabase/client';
import { parseSupabaseAuthError } from '@/lib/auth/errorParser';
import { globalEventBus } from '@/lib/events';
import { createUserRegisteredEvent, createUserLoggedInEvent } from '@/lib/events/domain/UserEvents';
import type { AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  error: AuthError | null;
  success: boolean;
  message?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Authentication Service
 * Pure business logic - no UI concerns, no toast notifications
 */
export class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
          },
        },
      });

      if (error) {
        return {
          error,
          success: false,
          message: parseSupabaseAuthError(error)
        };
      }

      // Publish domain event for registration
      if (authData.user) {
        const event = createUserRegisteredEvent({
          userId: authData.user.id,
          email: authData.user.email!,
          name: data.name,
          registrationMethod: 'email',
        });
        globalEventBus.publish(event);
      }

      return {
        error: null,
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.'
      };
    } catch (error) {
      return {
        error: error as AuthError,
        success: false,
        message: 'An unexpected error occurred during sign up'
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return {
          error,
          success: false,
          message: parseSupabaseAuthError(error)
        };
      }

      // Publish domain event for login
      if (authData.user && authData.session) {
        const event = createUserLoggedInEvent({
          userId: authData.user.id,
          sessionId: authData.session.access_token,
          timestamp: Date.now(),
        });
        globalEventBus.publish(event);
      }

      return {
        error: null,
        success: true,
        message: 'Signed in successfully'
      };
    } catch (error) {
      return {
        error: error as AuthError,
        success: false,
        message: 'An unexpected error occurred during sign in'
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return {
          error,
          success: false,
          message: parseSupabaseAuthError(error)
        };
      }

      return {
        error: null,
        success: true,
        message: 'Redirecting to Google...'
      };
    } catch (error) {
      return {
        error: error as AuthError,
        success: false,
        message: 'An unexpected error occurred during Google sign in'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          error,
          success: false,
          message: parseSupabaseAuthError(error)
        };
      }

      return {
        error: null,
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      return {
        error: error as AuthError,
        success: false,
        message: 'An unexpected error occurred during sign out'
      };
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    return { valid: true };
  }
}

// Export singleton instance
export const authService = new AuthService();
