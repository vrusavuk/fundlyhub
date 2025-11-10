/**
 * Simplified navigation context - breadcrumbs removed (now local to components)
 * Only handles back button navigation
 */
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationContextType {
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
    shouldShowBackButton,
    setShouldShowBackButton,
    navigateBack,
    referrer,
  }), [
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