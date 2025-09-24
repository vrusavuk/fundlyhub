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
          "w-full mt-2 border shadow-2xl backdrop-blur-md bg-background/90", 
          "animate-in fade-in-0 slide-in-from-top-2 duration-200",
          maxHeight,
          className
        )}
        style={{
          background: `hsla(var(--background), 0.85)`,
          backdropFilter: 'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid hsla(var(--border), 0.2)',
          borderRadius: 'var(--radius)',
          boxShadow: `
            0 20px 60px -10px hsla(var(--foreground), 0.15),
            0 8px 25px -5px hsla(var(--foreground), 0.1),
            inset 0 1px 0 hsla(var(--background), 0.4),
            inset 0 0 0 1px hsla(var(--border), 0.05)
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