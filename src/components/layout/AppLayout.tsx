/**
 * Main application layout component
 * Provides consistent page structure with navigation
 */
import { ReactNode } from 'react';
import { Navigation } from '../navigation/Navigation';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function AppLayout({ children, className, fullWidth = false }: AppLayoutProps) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('AppLayout rendering');
  }
  
  return (
    <div className={`min-h-screen bg-gradient-subtle ${className || ''}`}>
      <Navigation />
      {fullWidth ? (
        children
      ) : (
        <main className="relative">
          <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      )}
    </div>
  );
}