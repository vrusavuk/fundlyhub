/**
 * React Hooks for Event Bus Integration
 * Following Single Responsibility and Interface Segregation Principles
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DomainEvent, EventHandler } from '@/lib/events/types';
import { globalEventBus } from '@/lib/events';

/**
 * Hook for publishing events
 * Following Single Responsibility Principle
 */
export function useEventPublisher() {
  const correlationIdRef = useRef<string>();

  const publish = useCallback(async <T extends DomainEvent>(event: T) => {
    await globalEventBus.publish(event);
  }, []);

  const publishBatch = useCallback(async <T extends DomainEvent>(events: T[]) => {
    await globalEventBus.publishBatch(events);
  }, []);

  const publishWithCorrelation = useCallback(async <T extends DomainEvent>(
    event: T,
    correlationId?: string
  ) => {
    const id = correlationId || correlationIdRef.current || crypto.randomUUID();
    correlationIdRef.current = id;
    
    const correlatedEvent = {
      ...event,
      correlationId: id,
    };
    
    await globalEventBus.publish(correlatedEvent);
    return id;
  }, []);

  const generateCorrelationId = useCallback(() => {
    const id = crypto.randomUUID();
    correlationIdRef.current = id;
    return id;
  }, []);

  return {
    publish,
    publishBatch,
    publishWithCorrelation,
    generateCorrelationId,
    currentCorrelationId: correlationIdRef.current,
  };
}

/**
 * Hook for subscribing to events
 * Following Interface Segregation Principle
 */
export function useEventSubscriber<T extends DomainEvent = DomainEvent>(
  eventType: string,
  handler: (event: T) => void | Promise<void>,
  dependencies: React.DependencyList = []
) {
  const handlerRef = useRef(handler);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  useEffect(() => {
    const eventHandler: EventHandler<T> = {
      eventType,
      handle: async (event: T) => {
        await handlerRef.current(event);
      },
    };

    unsubscribeRef.current = globalEventBus.subscribe(eventType, eventHandler);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [eventType]);

  return {
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    },
  };
}

/**
 * Hook for event-driven state management
 * Following Single Responsibility Principle
 */
export function useEventState<T>(
  initialState: T,
  eventHandlers: Record<string, (state: T, event: DomainEvent) => T>
) {
  const [state, setState] = useState<T>(initialState);
  const stateRef = useRef(state);

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Subscribe to all events that can modify state
  Object.keys(eventHandlers).forEach(eventType => {
    useEventSubscriber(
      eventType,
      useCallback((event: DomainEvent) => {
        const handler = eventHandlers[eventType];
        if (handler) {
          const newState = handler(stateRef.current, event);
          setState(newState);
        }
      }, [eventType])
    );
  });

  return [state, setState] as const;
}

/**
 * Hook for debugging event flow
 * Following Single Responsibility Principle
 */
export function useEventHistory(maxEvents = 100) {
  const [eventHistory, setEventHistory] = useState<DomainEvent[]>([]);

  useEventSubscriber(
    '*', // Listen to all events
    useCallback((event: DomainEvent) => {
      setEventHistory(prev => {
        const newHistory = [event, ...prev];
        return newHistory.slice(0, maxEvents);
      });
    }, [maxEvents])
  );

  const clearHistory = useCallback(() => {
    setEventHistory([]);
  }, []);

  const getEventsByType = useCallback((eventType: string) => {
    return eventHistory.filter(event => event.type === eventType);
  }, [eventHistory]);

  const getEventsByCorrelation = useCallback((correlationId: string) => {
    return eventHistory.filter(event => event.correlationId === correlationId);
  }, [eventHistory]);

  return {
    eventHistory,
    clearHistory,
    getEventsByType,
    getEventsByCorrelation,
    totalEvents: eventHistory.length,
  };
}

/**
 * Hook for event bus connection status
 * Following Single Responsibility Principle
 */
export function useEventBusStatus() {
  const [isConnected, setIsConnected] = useState(globalEventBus.isConnected);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(globalEventBus.isConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await globalEventBus.disconnect();
      await globalEventBus.connect();
      setLastError(null);
    } catch (error) {
      setLastError(error as Error);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await globalEventBus.disconnect();
      setLastError(null);
    } catch (error) {
      setLastError(error as Error);
    }
  }, []);

  return {
    isConnected,
    lastError,
    reconnect,
    disconnect,
  };
}
