import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
  disabled?: boolean;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: HTMLElement | Document;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enabled = true,
    target = document,
    ignoreInputs = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in input elements
    if (ignoreInputs) {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT' ||
         activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }
    }

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      if (shortcut.disabled) return false;

      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled, ignoreInputs]);

  useEffect(() => {
    if (!enabled) return;

    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);

  // Helper function to format shortcut display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.metaKey) parts.push('Cmd');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  return { formatShortcut };
}

// Common keyboard shortcuts for admin panels
export const CommonShortcuts = {
  navigation: {
    refresh: { key: 'F5', action: () => window.location.reload(), description: 'Refresh page' },
    home: { key: 'h', ctrlKey: true, description: 'Go to home' },
    search: { key: 'k', ctrlKey: true, description: 'Open search' },
    settings: { key: ',', ctrlKey: true, description: 'Open settings' },
  },
  
  table: {
    selectAll: { key: 'a', ctrlKey: true, description: 'Select all rows' },
    clearSelection: { key: 'Escape', description: 'Clear selection' },
    nextPage: { key: 'ArrowRight', ctrlKey: true, description: 'Next page' },
    prevPage: { key: 'ArrowLeft', ctrlKey: true, description: 'Previous page' },
  },

  actions: {
    create: { key: 'n', ctrlKey: true, description: 'Create new item' },
    edit: { key: 'e', ctrlKey: true, description: 'Edit selected item' },
    delete: { key: 'Delete', description: 'Delete selected items' },
    save: { key: 's', ctrlKey: true, description: 'Save changes' },
    cancel: { key: 'Escape', description: 'Cancel action' },
  },

  filters: {
    clearFilters: { key: 'c', ctrlKey: true, altKey: true, description: 'Clear all filters' },
    openFilters: { key: 'f', ctrlKey: true, description: 'Open filters' },
  },
};