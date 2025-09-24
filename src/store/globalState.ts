/**
 * Global State Management with Zustand
 * Centralized state for app-wide concerns
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  
  // User Preferences
  language: string;
  notifications: boolean;
  
  // Performance
  prefersReducedMotion: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setPrefersReducedMotion: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'system',
      sidebarCollapsed: false,
      language: 'en',
      notifications: true,
      prefersReducedMotion: false,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
      setPrefersReducedMotion: (prefersReducedMotion) => set({ prefersReducedMotion }),
    }),
    {
      name: 'app-state',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
        notifications: state.notifications,
        prefersReducedMotion: state.prefersReducedMotion,
      }),
    }
  )
);

// Performance monitoring state
interface PerformanceState {
  bundleSize: number;
  loadTime: number;
  interactionTime: number;
  
  setBundleSize: (size: number) => void;
  setLoadTime: (time: number) => void;
  setInteractionTime: (time: number) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  bundleSize: 0,
  loadTime: 0,
  interactionTime: 0,
  
  setBundleSize: (bundleSize) => set({ bundleSize }),
  setLoadTime: (loadTime) => set({ loadTime }),
  setInteractionTime: (interactionTime) => set({ interactionTime }),
}));

// Cache state for API responses
interface CacheState {
  cache: Record<string, { data: any; timestamp: number; ttl: number }>;
  
  setCache: (key: string, data: any, ttl?: number) => void;
  getCache: (key: string) => any | null;
  clearCache: (key?: string) => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: {},
  
  setCache: (key, data, ttl = 5 * 60 * 1000) => // 5 minutes default TTL
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          timestamp: Date.now(),
          ttl,
        },
      },
    })),
  
  getCache: (key) => {
    const cached = get().cache[key];
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      get().clearCache(key);
      return null;
    }
    
    return cached.data;
  },
  
  clearCache: (key) =>
    set((state) => {
      if (key) {
        const { [key]: removed, ...rest } = state.cache;
        return { cache: rest };
      }
      return { cache: {} };
    }),
}));