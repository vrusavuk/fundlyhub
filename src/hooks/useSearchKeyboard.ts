/**
 * Hook for managing search keyboard navigation and shortcuts
 * Provides keyboard navigation for search results and suggestions
 */
import { useState, useEffect, useCallback } from 'react';

interface UseSearchKeyboardOptions {
  isActive: boolean;
  itemCount: number;
  onSelect: (index: number) => void;
  onEscape: () => void;
}

interface UseSearchKeyboardResult {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  resetSelection: () => void;
}

export function useSearchKeyboard({
  isActive,
  itemCount,
  onSelect,
  onEscape
}: UseSearchKeyboardOptions): UseSearchKeyboardResult {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    if (!isActive) {
      resetSelection();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < itemCount - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : prev
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            onSelect(selectedIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onEscape();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, itemCount, selectedIndex, onSelect, onEscape]);

  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount) {
      setSelectedIndex(itemCount > 0 ? itemCount - 1 : -1);
    }
  }, [itemCount, selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    resetSelection
  };
}