import { useEffect, useCallback, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RealTimeOptions {
  enabled?: boolean;
  interval?: number;
  onUpdate?: (data: any) => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseRealTimeUpdatesProps<T> {
  fetchFn: () => Promise<T>;
  dependencies?: any[];
  options?: RealTimeOptions;
}

interface RealTimeState {
  isConnected: boolean;
  lastUpdate: Date | null;
  errorCount: number;
  retryCount: number;
}

export function useRealTimeUpdates<T>({
  fetchFn,
  dependencies = [],
  options = {},
}: UseRealTimeUpdatesProps<T>) {
  const { toast } = useToast();
  const {
    enabled = true,
    interval = 30000, // 30 seconds default
    onUpdate,
    onError,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [state, setState] = useState<RealTimeState>({
    isConnected: false,
    lastUpdate: null,
    errorCount: 0,
    retryCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async (showLoading = false) => {
    if (!mountedRef.current) return;

    try {
      if (showLoading) {
        setLoading(true);
      }

      const result = await fetchFn();
      
      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      setState(prev => ({
        ...prev,
        isConnected: true,
        lastUpdate: new Date(),
        errorCount: 0,
        retryCount: 0,
      }));

      if (onUpdate) {
        onUpdate(result);
      }

    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        errorCount: prev.errorCount + 1,
      }));

      if (onError) {
        onError(error);
      }

      // Show toast for persistent errors
      if (state.errorCount >= 2) {
        toast({
          title: "Connection Issues",
          description: "Having trouble updating data. Retrying...",
          variant: "destructive",
        });
      }

      // Retry logic
      if (state.retryCount < retryAttempts) {
        setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchData(false);
          }
        }, retryDelay * (state.retryCount + 1)); // Exponential backoff
      }

    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [fetchFn, onUpdate, onError, state.errorCount, state.retryCount, retryAttempts, retryDelay, toast]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(true);
    }
  }, [enabled, ...dependencies]);

  // Setup polling interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Stop/start functions
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const start = useCallback(() => {
    if (enabled && !intervalRef.current) {
      fetchData(true);
      intervalRef.current = setInterval(() => {
        fetchData(false);
      }, interval);
    }
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    state,
    refresh,
    stop,
    start,
  };
}

// Hook for WebSocket-based real-time updates (future enhancement)
export function useWebSocketUpdates<T>(url: string, options: RealTimeOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { onUpdate, onError } = options;

  useEffect(() => {
    // WebSocket implementation would go here
    // This is a placeholder for future WebSocket integration
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    data,
    isConnected,
    error,
    send,
  };
}