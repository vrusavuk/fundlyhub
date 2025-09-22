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
  return (
    <div className={`min-h-screen bg-gradient-subtle ${className || ''}`}>
      <Navigation />
      {fullWidth ? (
        children
      ) : (
        <main className="relative">
          <div className="container mx-auto mobile-page-spacing">
            {children}
          </div>
        </main>
      )}
    </div>
  );
}