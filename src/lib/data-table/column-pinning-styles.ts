/**
 * Column Pinning Styles for TanStack Table
 * Provides sticky column positioning with shadow effects
 */

import type { Column } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

/**
 * Returns CSS properties for sticky column positioning with shadow effects
 */
export function getColumnPinningStyles<TData>(
  column: Column<TData>,
  isHeader: boolean = false
): CSSProperties {
  const isPinned = column.getIsPinned();
  
  if (!isPinned) {
    return {};
  }

  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    position: 'sticky',
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: isHeader ? 2 : 1, // Headers need higher z-index
    // Shadow effects for visual separation
    boxShadow: isLastLeftPinnedColumn
      ? '4px 0 8px -4px hsl(var(--foreground) / 0.1)'
      : isFirstRightPinnedColumn
      ? '-4px 0 8px -4px hsl(var(--foreground) / 0.1)'
      : undefined,
  };
}
