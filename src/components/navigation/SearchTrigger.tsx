/**
 * Search trigger button component
 * Handles search functionality activation
 */
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '@/contexts/SearchContext';

interface SearchTriggerProps {
  className?: string;
  variant?: 'icon' | 'button';
  onSearchOpen?: () => void;
}

export function SearchTrigger({ 
  className, 
  variant = 'icon',
  onSearchOpen 
}: SearchTriggerProps) {
  const { openHeaderSearch } = useGlobalSearch();

  const handleSearchClick = () => {
    openHeaderSearch();
    onSearchOpen?.();
  };

  if (variant === 'button') {
    return (
      <Button 
        variant="outline" 
        className={`justify-start ${className || ''}`}
        onClick={handleSearchClick}
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="icon"
      className={`hidden md:flex ${className || ''}`}
      onClick={handleSearchClick}
      title="Search (Ctrl+K)"
    >
      <Search className="h-5 w-5" />
    </Button>
  );
}