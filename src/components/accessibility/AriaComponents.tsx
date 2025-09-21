/**
 * Accessibility React components
 * Provides ARIA-compliant components for better screen reader support
 */
import React from 'react';

// Skip link component
interface SkipLinkProps {
  href: string;
  children: string;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded"
    >
      {children}
    </a>
  );
}

// Visually hidden component
interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// ARIA landmarks
export function Main({ children, ...props }: React.ComponentProps<'main'>) {
  return (
    <main role="main" {...props}>
      {children}
    </main>
  );
}

export function Banner({ children, ...props }: React.ComponentProps<'header'>) {
  return (
    <header role="banner" {...props}>
      {children}
    </header>
  );
}

interface NavigationProps extends React.ComponentProps<'nav'> {
  label?: string;
}

export function Navigation({ children, label, ...props }: NavigationProps) {
  return (
    <nav role="navigation" aria-label={label} {...props}>
      {children}
    </nav>
  );
}

export function ContentInfo({ children, ...props }: React.ComponentProps<'footer'>) {
  return (
    <footer role="contentinfo" {...props}>
      {children}
    </footer>
  );
}