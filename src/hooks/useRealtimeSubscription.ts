/**
 * Unified Realtime Subscription Hook
 * Consolidates useSupabaseRealtime and useAdminRealtime
 * Provides a single interface for all Supabase realtime subscriptions
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/services/logger.service';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig {
  /** Table name to subscribe to */
  table: string;
  /** Schema (default: 'public') */
  schema?: string;
  /** Events to listen for (default: all) */
  events?: RealtimeEvent[];
  /** Filter expression (e.g., 'user_id=eq.123') */
  filter?: string;
  /** Callback for INSERT events */
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  /** Callback for UPDATE events */
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  /** Callback for DELETE events */
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  /** Callback for any change event */
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Whether subscription is enabled (default: true) */
  enabled?: boolean;
  /** Whether to show toast notifications (default: false) */
  showToasts?: boolean;
  /** Auto-reconnect on error (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 5000) */
  reconnectDelayMs?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealtimeState {
  /** Whether the subscription is currently connected */
  isConnected: boolean;
  /** Whether the subscription is active */
  isSubscribed: boolean;
  /** Current connection status */
  connectionStatus: ConnectionStatus;
  /** Last error if any */
  error: Error | null;
  /** Last received event payload */
  lastEvent: RealtimePostgresChangesPayload<any> | null;
  /** Total number of events received */
  eventCount: number;
}

export interface UseRealtimeSubscriptionResult extends RealtimeState {
  /** Manually subscribe to the channel */
  subscribe: () => void;
  /** Manually unsubscribe from the channel */
  unsubscribe: () => void;
  /** Reconnect to the channel */
  reconnect: () => void;
}

const DEFAULT_CONFIG: Required<Omit<RealtimeSubscriptionConfig, 'table' | 'onInsert' | 'onUpdate' | 'onDelete' | 'onChange' | 'onError' | 'filter'>> = {
  schema: 'public',
  events: ['INSERT', 'UPDATE', 'DELETE'],
  enabled: true,
  showToasts: false,
  autoReconnect: true,
  reconnectDelayMs: 5000,
};

export function useRealtimeSubscription(config: RealtimeSubscriptionConfig): UseRealtimeSubscriptionResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { toast } = useToast();

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isSubscribed: false,
    connectionStatus: 'disconnected',
    error: null,
    lastEvent: null,
    eventCount: 0,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const handleEvent = useCallback((
    event: RealtimeEvent,
    payload: RealtimePostgresChangesPayload<any>
  ) => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      lastEvent: payload,
      eventCount: prev.eventCount + 1,
    }));

    // Call specific event handlers
    switch (event) {
      case 'INSERT':
        fullConfig.onInsert?.(payload);
        if (fullConfig.showToasts) {
          toast({
            title: 'New Record',
            description: `A new ${fullConfig.table} record was created`,
          });
        }
        break;
      case 'UPDATE':
        fullConfig.onUpdate?.(payload);
        if (fullConfig.showToasts) {
          toast({
            title: 'Record Updated',
            description: `A ${fullConfig.table} record was updated`,
          });
        }
        break;
      case 'DELETE':
        fullConfig.onDelete?.(payload);
        if (fullConfig.showToasts) {
          toast({
            title: 'Record Deleted',
            description: `A ${fullConfig.table} record was deleted`,
            variant: 'destructive',
          });
        }
        break;
    }

    // Call general change handler
    fullConfig.onChange?.(payload);
  }, [fullConfig.table, fullConfig.onInsert, fullConfig.onUpdate, fullConfig.onDelete, fullConfig.onChange, fullConfig.showToasts, toast]);

  const subscribe = useCallback(() => {
    if (!fullConfig.enabled || channelRef.current) return;

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    const channelName = `realtime:${fullConfig.schema}:${fullConfig.table}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Subscribe to postgres changes for each event type
    const eventsToSubscribe = fullConfig.events.includes('*') 
      ? ['INSERT', 'UPDATE', 'DELETE'] as const
      : fullConfig.events.filter(e => e !== '*') as ('INSERT' | 'UPDATE' | 'DELETE')[];

    eventsToSubscribe.forEach(event => {
      const changeConfig: any = {
        event,
        schema: fullConfig.schema,
        table: fullConfig.table,
      };

      if (fullConfig.filter) {
        changeConfig.filter = fullConfig.filter;
      }

      channel.on('postgres_changes', changeConfig, (payload) => {
        handleEvent(event, payload);
      });
    });

    // Handle subscription status
    channel.subscribe((status, err) => {
      if (!mountedRef.current) return;

      switch (status) {
        case 'SUBSCRIBED':
          setState(prev => ({
            ...prev,
            isConnected: true,
            isSubscribed: true,
            error: null,
            connectionStatus: 'connected',
          }));
          
          logger.debug('Realtime subscription connected', {
            componentName: 'useRealtimeSubscription',
            operationName: 'subscribe',
            metadata: { table: fullConfig.table, schema: fullConfig.schema }
          });
          break;
          
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
        case 'CLOSED':
          const error = err || new Error(`Subscription ${status.toLowerCase()}`);
          setState(prev => ({
            ...prev,
            isConnected: false,
            isSubscribed: false,
            error,
            connectionStatus: 'error',
          }));
          fullConfig.onError?.(error);
          
          if (fullConfig.showToasts && status === 'CHANNEL_ERROR') {
            toast({
              title: 'Real-time Connection Error',
              description: 'Lost connection to real-time updates',
              variant: 'destructive',
            });
          }
          
          logger.warn('Realtime subscription error', {
            componentName: 'useRealtimeSubscription',
            operationName: 'subscribe',
            metadata: { table: fullConfig.table, status, error: error.message }
          });
          break;
      }
    });

    channelRef.current = channel;
  }, [fullConfig, handleEvent, toast]);

  const unsubscribe = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        isSubscribed: false,
        connectionStatus: 'disconnected',
      }));
    }
  }, []);

  const reconnect = useCallback(() => {
    unsubscribe();
    // Wait before reconnecting
    reconnectTimeoutRef.current = setTimeout(subscribe, 1000);
  }, [unsubscribe, subscribe]);

  // Setup subscription
  useEffect(() => {
    if (fullConfig.enabled) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [fullConfig.enabled, fullConfig.table, fullConfig.schema, fullConfig.filter]);

  // Auto-reconnect on errors
  useEffect(() => {
    if (state.connectionStatus === 'error' && fullConfig.enabled && fullConfig.autoReconnect) {
      reconnectTimeoutRef.current = setTimeout(reconnect, fullConfig.reconnectDelayMs);
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [state.connectionStatus, fullConfig.enabled, fullConfig.autoReconnect, fullConfig.reconnectDelayMs, reconnect]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect,
  };
}

/**
 * Hook for managing multiple real-time subscriptions
 */
export function useMultipleRealtimeSubscriptions(configs: RealtimeSubscriptionConfig[]) {
  const subscriptions = configs.map(config => useRealtimeSubscription(config));
  
  const overallState = {
    allConnected: subscriptions.every(sub => sub.isConnected),
    anyConnected: subscriptions.some(sub => sub.isConnected),
    totalEvents: subscriptions.reduce((sum, sub) => sum + sub.eventCount, 0),
    errors: subscriptions.filter(sub => sub.error).map(sub => sub.error),
  };

  const reconnectAll = useCallback(() => {
    subscriptions.forEach(sub => sub.reconnect());
  }, [subscriptions]);

  const unsubscribeAll = useCallback(() => {
    subscriptions.forEach(sub => sub.unsubscribe());
  }, [subscriptions]);

  return {
    subscriptions,
    overallState,
    reconnectAll,
    unsubscribeAll,
  };
}
