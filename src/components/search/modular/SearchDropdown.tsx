/**
 * Modular search dropdown component
 * Simplified and focused version of the enhanced dropdown
 */
import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSearchModal } from '@/hooks/useSearchModal';

interface SearchDropdownProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function SearchDropdown({
  isVisible,
  onClose,
  children,
  className,
  maxHeight = 'max-h-[70vh]'
}: SearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useSearchModal({
    isOpen: isVisible,
    onClose,
    closeOnOutsideClick: true
  });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 top-16 px-3 sm:px-4 md:px-6 z-50">
      <Card
        ref={dropdownRef}
        className={cn(
          "w-full mt-2 border shadow-2xl",
          "animate-in fade-in-0 slide-in-from-top-2 duration-200",
          maxHeight,
          className
        )}
        style={{
          background: `hsl(var(--background) / 0.04)`,
          backdropFilter: 'blur(50px) saturate(2.5) brightness(1.2)',
          WebkitBackdropFilter: 'blur(50px) saturate(2.5) brightness(1.2)',
          border: '1px solid hsl(var(--border) / 0.4)',
          boxShadow: `
            0 12px 40px hsl(var(--foreground) / 0.15),
            0 6px 20px hsl(var(--foreground) / 0.08),
            inset 0 1px 0 hsl(var(--background) / 0.2)
          `
        }}
      >
        <ScrollArea className="max-h-[70vh]">
          <div className="p-1">
            {children}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}