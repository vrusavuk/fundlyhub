import { ReactNode } from 'react';

/**
 * Admin Layout Type Definitions
 * 
 * Centralized type definitions for admin page layouts and components
 */

export interface BadgeConfig {
  text: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface PageHeaderConfig {
  title: string;
  description?: string;
  badge?: BadgeConfig;
  actions?: ReactNode;
}

export interface PageSectionProps {
  children: ReactNode;
  spacing?: 'tight' | 'normal' | 'relaxed';
  background?: 'white' | 'gray' | 'transparent';
  className?: string;
}

export interface PageGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'tight' | 'normal' | 'relaxed';
  className?: string;
}

export interface AdminPageLayoutProps extends PageHeaderConfig {
  children: ReactNode;
  className?: string;
}
