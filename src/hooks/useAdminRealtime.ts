/**
 * Admin Real-time Updates Hook
 * Subscribes to real-time changes for admin tables
 * Implements Dependency Inversion - depends on abstractions
 */

import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'profiles' | 'fundraisers' | 'organizations' | 'roles' | 'user_role_assignments' | 'audit_logs';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseAdminRealtimeOptions {
  table: TableName;
  event?: EventType;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions) {
  const { table, event = '*', onInsert, onUpdate, onDelete, onError } = options;

  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    try {
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload);
          break;
        case 'UPDATE':
          onUpdate?.(payload);
          break;
        case 'DELETE':
          onDelete?.(payload);
          break;
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onInsert, onUpdate, onDelete, onError]);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-${table}-changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, handleChange]);
}

/**
 * Hook for multiple table subscriptions
 */
export function useAdminRealtimeMultiple(subscriptions: UseAdminRealtimeOptions[]) {
  useEffect(() => {
    const channels = subscriptions.map(({ table, event = '*', onInsert, onUpdate, onDelete, onError }) => {
      const handleChange = (payload: RealtimePostgresChangesPayload<any>) => {
        try {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        } catch (error) {
          onError?.(error as Error);
        }
      };

      return supabase
        .channel(`admin-${table}-changes`)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table
          },
          handleChange
        )
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [subscriptions]);
}
