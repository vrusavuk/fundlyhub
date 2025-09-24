/**
 * Hook for managing search modal state and behavior
 * Centralizes modal-specific logic and keyboard shortcuts
 */
import { useState, useEffect, useCallback } from 'react';
import { useGlobalSearch } from '@/contexts/UnifiedSearchContext';

interface UseSearchModalOptions {
  isOpen: boolean;
  onClose: () => void;
  autoFocus?: boolean;
  closeOnOutsideClick?: boolean;
}

interface UseSearchModalResult {
  isOpen: boolean;
  close: () => void;
  handleEscape: (e: KeyboardEvent) => void;
  handleOutsideClick: (target: EventTarget | null) => void;
}

export function useSearchModal({
  isOpen,
  onClose,
  autoFocus = true,
  closeOnOutsideClick = true
}: UseSearchModalOptions): UseSearchModalResult {
  const { closeHeaderSearch } = useGlobalSearch();

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOutsideClick = useCallback((target: EventTarget | null) => {
    if (!closeOnOutsideClick || !isOpen) return;
    
    // Check if click is outside the modal content
    const modalContent = document.querySelector('[data-search-modal-content]');
    if (modalContent && target && !modalContent.contains(target as Node)) {
      onClose();
    }
  }, [isOpen, onClose, closeOnOutsideClick]);

  // Set up keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  // Set up click outside listener
  useEffect(() => {
    if (isOpen && closeOnOutsideClick) {
      const handler = (e: MouseEvent) => handleOutsideClick(e.target);
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [isOpen, closeOnOutsideClick, handleOutsideClick]);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    isOpen,
    close,
    handleEscape,
    handleOutsideClick
  };
}