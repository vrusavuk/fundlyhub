/**
 * Search modal wrapper component
 * Handles modal positioning, backdrop, and layout
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SearchModal({ isOpen, children, className }: SearchModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div 
        className={cn("fixed top-0 left-0 right-0 z-50", className)}
        data-search-modal-content
      >
        {children}
      </div>
    </>
  );
}