/**
 * Column Pinning Styles for TanStack Table
 * Provides sticky column positioning with scroll-aware shadow effects
 */

import type { Column } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

export interface ScrollState {
  /** Whether user has scrolled away from the left edge */
  isScrolledLeft: boolean;
  /** Whether user has scrolled away from the right edge */
  isScrolledRight: boolean;
}

/**
 * Returns CSS properties for sticky column positioning with scroll-aware shadow effects
 * Shadows only appear when there's content scrolled underneath the pinned column
 */
export function getColumnPinningStyles<TData>(
  column: Column<TData>,
  isHeader: boolean = false,
  scrollState?: ScrollState
): CSSProperties {
  const isPinned = column.getIsPinned();
  
  if (!isPinned) {
    return {};
  }

  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  // Only show shadows when there's content scrolled under the pinned column
  const showLeftShadow = isLastLeftPinnedColumn && scrollState?.isScrolledLeft;
  const showRightShadow = isFirstRightPinnedColumn && scrollState?.isScrolledRight;

  return {
    position: 'sticky',
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: isHeader ? 2 : 1,
    // Shadow effects only when content is scrolled underneath
    boxShadow: showLeftShadow
      ? '4px 0 8px -4px hsl(var(--foreground) / 0.15)'
      : showRightShadow
      ? '-4px 0 8px -4px hsl(var(--foreground) / 0.15)'
      : undefined,
  };
}
