/**
 * Search input component with clear functionality
 * Focused component for search input handling
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Delete, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onClose: () => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
}

export function SearchInput({
  query,
  onChange,
  onSubmit,
  onClear,
  onClose,
  placeholder = "Search campaigns, users, organizations...",
  inputRef,
  className,
  showClearButton = true,
  autoFocus = false,
  onFocus
}: SearchInputProps) {
  return (
    <div 
      className={cn(
        "border-b border-border/20 shadow-strong",
        className
      )}
      style={{
        background: `hsl(var(--background) / 0.95)`,
        boxShadow: `
          0 6px 20px hsl(var(--foreground) / 0.12),
          inset 0 1px 0 hsl(var(--background) / 0.9),
          inset 0 -1px 0 hsl(var(--foreground) / 0.05)
        `
      }}
    >
      <div className="w-full px-3 sm:px-4 md:px-6">
        <form onSubmit={onSubmit} className="flex items-center h-16 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              placeholder={placeholder}
              className={cn(
                "pl-10 pr-12 h-12 sm:h-10 border-2 bg-background focus:bg-background transition-all duration-200",
                "focus:border-primary focus:shadow-lg focus:shadow-primary/20 animate-fade-in",
                "text-base sm:text-sm touch-manipulation"
              )}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              autoFocus={autoFocus}
            />
            {query && showClearButton && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 rounded-full transition-colors duration-200"
                title="Clear search"
              >
                <Delete className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            )}
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="touch-target"
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}