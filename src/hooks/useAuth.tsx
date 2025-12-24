import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import { createUserRegisteredEvent, createUserLoggedInEvent } from '@/lib/events/domain/UserEvents';
import { logger } from '@/lib/services/logger.service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthAvatarUrl = (u: User | null | undefined): string | null => {
    if (!u) return null;
    const md = (u.user_metadata || {}) as Record<string, unknown>;
    const avatarUrl = (md.avatar_url as string | undefined) || (md.picture as string | undefined);
    return avatarUrl || null;
  };

  const syncProfileAvatarFromAuth = async (u: User | null | undefined) => {
    try {
      if (!u) return;

      const authAvatar = getAuthAvatarUrl(u);
      if (!authAvatar) return;

      // Only write if the profile doesn't already have an avatar.
      const { data: existing, error: readError } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', u.id)
        .maybeSingle();

      if (readError) throw readError;
      if (existing?.avatar) return;

      // Use the secure RPC to set avatar
      const { error: updateError } = await supabase
        .rpc('set_my_profile_avatar', { p_avatar_url: authAvatar });

      if (updateError) throw updateError;
    } catch (error) {
      // Non-blocking: if RLS prevents this, the app still works.
      logger.error('Failed to sync profile avatar from auth metadata', error as Error, {
        componentName: 'useAuth',
        operationName: 'syncProfileAvatarFromAuth',
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Keep avatar as a single source of truth (profiles.avatar)
          void syncProfileAvatarFromAuth(session?.user);
        }
      }
    );

    // Get initial session - this will trigger the onAuthStateChange callback
    supabase.auth.getSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || '',
        }
      }
    });

    // Publish user registered event
    if (!error && data.user) {
      try {
        const event = createUserRegisteredEvent({
          userId: data.user.id,
          email: data.user.email || email,
          name: name || '',
        });
        await globalEventBus.publish(event);
      } catch (eventError) {
        logger.error(
          'Failed to publish user registered event',
          eventError instanceof Error ? eventError : new Error(String(eventError)),
          {
            componentName: 'useAuth',
            operationName: 'signUp',
            userId: data.user?.id
          }
        );
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Publish user logged in event
    if (!error && data.user) {
      try {
        const event = createUserLoggedInEvent({
          userId: data.user.id,
          sessionId: data.session?.access_token || '',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
        await globalEventBus.publish(event);
      } catch (eventError) {
        logger.error(
          'Failed to publish user logged in event',
          eventError instanceof Error ? eventError : new Error(String(eventError)),
          {
            componentName: 'useAuth',
            operationName: 'signIn',
            userId: data.user?.id
          }
        );
      }
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}