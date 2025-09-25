import { useState } from 'react';
import { ChevronDown, Filter, SortAsc, SortDesc, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MobileDataTableProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  title: string;
  totalCount: number;
  selectedCount?: number;
  onSelectionChange?: (selectedIds: string[]) => void;
  sortOptions?: Array<{ key: string; label: string }>;
  filterOptions?: Array<{ key: string; label: string; options: Array<{ value: string; label: string }> }>;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  bulkActions?: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'destructive';
  }>;
}

export function MobileDataTable<T extends { id: string }>({
  data,
  renderCard,
  title,
  totalCount,
  selectedCount = 0,
  onSelectionChange,
  sortOptions = [],
  filterOptions = [],
  loading = false,
  error,
  emptyMessage = 'No data available',
  bulkActions = []
}: MobileDataTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleItemSelect = (itemId: string, selected: boolean) => {
    const newSelection = selected 
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId);
    
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
      onSelectionChange?.([]);
    } else {
      const allIds = data.map(item => item.id);
      setSelectedItems(allIds);
      onSelectionChange?.(allIds);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} total {selectedCount > 0 && `• ${selectedCount} selected`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sort */}
          {sortOptions.length > 0 && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SortAsc className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filters */}
          {filterOptions.length > 0 && (
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {filterOptions.map(filter => (
                    <div key={filter.key}>
                      <label className="text-sm font-medium">{filter.label}</label>
                      <Select 
                        value={filters[filter.key] || ''} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, [filter.key]: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && bulkActions.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedCount} selected</Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedItems([])}
                >
                  Clear
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {bulkActions.map(action => (
                    <DropdownMenuItem key={action.key}>
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select All */}
      {data.length > 0 && onSelectionChange && (
        <div className="flex items-center justify-between py-2 border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSelectAll}
          >
            {selectedItems.length === data.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      )}

      {/* Data List */}
      {data.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.id} className="relative">
              {onSelectionChange && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                </div>
              )}
              {renderCard(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}