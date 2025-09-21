import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useGlobalSearch } from "@/contexts/SearchContext";

const categories = [
  "All",
  "Medical",
  "Education", 
  "Emergency",
  "Community",
  "Sports",
  "Animals",
  "Environment",
  "Arts & Culture",
  "Technology",
  "Other"
];

interface IntegratedCampaignSearchProps {
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
  resultCount: number;
  totalCount: number;
  className?: string;
}

export function IntegratedCampaignSearch({
  onSearchChange,
  onCategoryChange,
  selectedCategory,
  resultCount,
  totalCount,
  className = ""
}: IntegratedCampaignSearchProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const { searchQuery, clearSearch } = useGlobalSearch();
  const location = useLocation();

  // Sync with global search context
  useEffect(() => {
    if (searchQuery !== localSearchTerm) {
      setLocalSearchTerm(searchQuery);
      onSearchChange(searchQuery);
    }
  }, [searchQuery]);

  // Get search term from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search') || '';
    if (urlSearch && urlSearch !== localSearchTerm) {
      setLocalSearchTerm(urlSearch);
      onSearchChange(urlSearch);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    onSearchChange("");
    clearSearch();
  };

  const handleClearFilters = () => {
    handleClearSearch();
    onCategoryChange("All");
  };

  const hasActiveFilters = localSearchTerm || selectedCategory !== "All";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search campaigns by title, creator, or description..."
          className="pl-10 pr-10"
        />
        {localSearchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {localSearchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{localSearchTerm}"
                  <button onClick={handleClearSearch} className="hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory !== "All" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <button onClick={() => onCategoryChange("All")} className="hover:bg-muted rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results Summary & Clear All */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {resultCount === totalCount 
              ? `${totalCount} campaigns` 
              : `${resultCount} of ${totalCount} campaigns`
            }
          </span>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}