/**
 * Integrated search component for campaigns page - real-time filtering
 */
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface IntegratedCampaignSearchProps {
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
  resultCount: number;
  totalCount: number;
  className?: string;
}

const CATEGORIES = [
  'All', 'Medical', 'Education', 'Community', 'Emergency', 
  'Animal', 'Environment', 'Sports', 'Arts'
];

export function IntegratedCampaignSearch({
  onSearchChange,
  onCategoryChange,
  selectedCategory,
  resultCount,
  totalCount,
  className
}: IntegratedCampaignSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    
    setSearchQuery(urlSearch);
    onSearchChange(urlSearch);
    onCategoryChange(urlCategory);
    
    // Expand if there are active filters
    if (urlSearch || urlCategory !== 'All') {
      setIsExpanded(true);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (category !== 'All') {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    onSearchChange('');
    onCategoryChange('All');
    setSearchParams({});
    setIsExpanded(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Search campaigns by title, description, or organizer..."
          className="pl-10 pr-24 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <span>
              Showing {resultCount} of {totalCount} campaigns
              {searchQuery && (
                <span className="ml-1">
                  for "<span className="font-medium">{searchQuery}</span>"
                </span>
              )}
            </span>
          ) : (
            <span>Showing all {totalCount} campaigns</span>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Category Filters - Expanded */}
      {isExpanded && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Filter by category</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Search: {searchQuery}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="ml-1 h-3 w-3 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
          {selectedCategory !== 'All' && (
            <Badge variant="secondary" className="text-xs">
              Category: {selectedCategory}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategoryChange('All')}
                className="ml-1 h-3 w-3 p-0"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}