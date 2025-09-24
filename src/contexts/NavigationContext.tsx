/**
 * Navigation context for tracking user journey and generating smart breadcrumbs
 */
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isLoading?: boolean;
}

interface NavigationContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  shouldShowBackButton: boolean;
  setShouldShowBackButton: (show: boolean) => void;
  navigateBack: () => void;
  referrer: string | null;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [shouldShowBackButton, setShouldShowBackButton] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Track navigation history
  useEffect(() => {
    const state = location.state as { from?: string } | null;
    if (state?.from) {
      setReferrer(state.from);
    }
  }, [location]);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbs(prev => [...prev, item]);
  }, []);

  const navigateBack = useCallback(() => {
    if (referrer) {
      navigate(referrer);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [referrer, navigate]);

  const value = useMemo(() => ({
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    shouldShowBackButton,
    setShouldShowBackButton,
    navigateBack,
    referrer,
  }), [
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    shouldShowBackButton,
    setShouldShowBackButton,
    navigateBack,
    referrer,
  ]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}