/**
 * Main application layout component
 * Provides consistent page structure with navigation
 */
import { ReactNode } from 'react';
import { Navigation } from '../navigation/Navigation';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-subtle ${className || ''}`}>
      <Navigation />
      <main className="relative">
        {children}
      </main>
    </div>
  );
}