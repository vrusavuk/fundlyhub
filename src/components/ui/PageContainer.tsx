/**
 * Container component for consistent page layouts
 * Provides standardized spacing and responsive design
 */
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full'
};

export function PageContainer({ 
  children, 
  maxWidth = 'xl',
  className 
}: PageContainerProps) {
  return (
    <div className={`container mx-auto mobile-container ${maxWidthClasses[maxWidth]} ${className || ''}`}>
      {children}
    </div>
  );
}