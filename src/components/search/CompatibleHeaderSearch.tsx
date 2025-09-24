/**
 * Compatible HeaderSearch component that can work with both contexts
 * Provides fallback mechanism for smooth migration
 */
import React from 'react';
import { HeaderSearch } from './HeaderSearch';
import { RefactoredHeaderSearch } from './RefactoredHeaderSearch';

interface CompatibleHeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
  useRefactored?: boolean;
}

export function CompatibleHeaderSearch({ 
  isOpen, 
  onClose, 
  useRefactored = false 
}: CompatibleHeaderSearchProps) {
  
  // Use refactored version if requested
  if (useRefactored) {
    try {
      return <RefactoredHeaderSearch isOpen={isOpen} onClose={onClose} />;
    } catch (error) {
      console.warn('RefactoredHeaderSearch failed, falling back to original:', error);
    }
  }
  
  // Default to original HeaderSearch for compatibility
  return <HeaderSearch isOpen={isOpen} onClose={onClose} />;
}