/**
 * Breadcrumb Context
 * Allows detail pages to override breadcrumbs with dynamic entity names
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BreadcrumbItem } from '@/hooks/useBreadcrumbs';

interface BreadcrumbContextType {
  customBreadcrumbs: BreadcrumbItem[] | null;
  setCustomBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ customBreadcrumbs, setCustomBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return context;
}
