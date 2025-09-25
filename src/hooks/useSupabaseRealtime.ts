import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeConfig {
  table: string;
  schema?: string;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  showToasts?: boolean;
}

interface RealtimeState {
  isConnected: boolean;
  isSubscribed: boolean;
  error: Error | null;
  lastEvent: RealtimePostgresChangesPayload<any> | null;
  eventCount: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useSupabaseRealtime(config: RealtimeConfig) {
  const { toast } = useToast();
  const {
    table,
    schema = 'public',
    events = ['INSERT', 'UPDATE', 'DELETE'],
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
    onError,
    enabled = true,
    showToasts = false,
  } = config;

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isSubscribed: false,
    error: null,
    lastEvent: null,
    eventCount: 0,
    connectionStatus: 'disconnected',
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleEvent = useCallback((
    event: 'INSERT' | 'UPDATE' | 'DELETE',
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
        onInsert?.(payload);
        if (showToasts) {
          toast({
            title: 'New Record',
            description: `A new ${table} record was created`,
          });
        }
        break;
      case 'UPDATE':
        onUpdate?.(payload);
        if (showToasts) {
          toast({
            title: 'Record Updated',
            description: `A ${table} record was updated`,
          });
        }
        break;
      case 'DELETE':
        onDelete?.(payload);
        if (showToasts) {
          toast({
            title: 'Record Deleted',
            description: `A ${table} record was deleted`,
            variant: 'destructive',
          });
        }
        break;
    }

    // Call general change handler
    onChange?.(payload);
  }, [table, onInsert, onUpdate, onDelete, onChange, showToasts, toast]);

  const subscribe = useCallback(() => {
    if (!enabled || channelRef.current) return;

    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    const channelName = `realtime:${schema}:${table}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Subscribe to postgres changes for each event type
    events.forEach(event => {
      const changeConfig: any = {
        event,
        schema,
        table,
      };

      if (filter) {
        changeConfig.filter = filter;
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
          onError?.(error);
          
          if (showToasts && status === 'CHANNEL_ERROR') {
            toast({
              title: 'Real-time Connection Error',
              description: 'Lost connection to real-time updates',
              variant: 'destructive',
            });
          }
          break;
      }
    });

    channelRef.current = channel;
  }, [enabled, schema, table, events, filter, handleEvent, onError, showToasts, toast]);

  const unsubscribe = useCallback(() => {
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
    setTimeout(subscribe, 1000); // Wait 1 second before reconnecting
  }, [unsubscribe, subscribe]);

  // Setup subscription
  useEffect(() => {
    if (enabled) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [enabled, subscribe, unsubscribe]);

  // Auto-reconnect on errors
  useEffect(() => {
    if (state.connectionStatus === 'error' && enabled) {
      const timeout = setTimeout(reconnect, 5000); // Retry after 5 seconds
      return () => clearTimeout(timeout);
    }
  }, [state.connectionStatus, enabled, reconnect]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect,
  };
}

// Hook for managing multiple real-time subscriptions
export function useMultipleRealtime(configs: RealtimeConfig[]) {
  const subscriptions = configs.map(config => useSupabaseRealtime(config));
  
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