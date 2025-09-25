import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';
const MOBILE_BREAKPOINT = 768;

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Check if mobile
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (isMobile) return true; // Always collapsed on mobile
    
    // Get saved state from localStorage for desktop
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile, restore saved state on desktop
      if (mobile) {
        setCollapsed(true);
      } else {
        const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        setCollapsed(saved ? JSON.parse(saved) : false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist state to localStorage (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(collapsed));
    }
  }, [collapsed, isMobile]);

  const toggle = () => {
    setCollapsed(prev => !prev);
  };

  return {
    collapsed,
    isMobile,
    toggle,
    setCollapsed
  };
}