import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Heart, Share2, BookmarkPlus, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const categories = [
  { name: 'Medical', emoji: '🏥', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Emergency', emoji: '🚨', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Education', emoji: '🎓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Community', emoji: '🏘️', color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'Animal', emoji: '🐾', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Environment', emoji: '🌱', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Sports', emoji: '⚽', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Arts', emoji: '🎨', color: 'bg-pink-50 text-pink-700 border-pink-200' },
];

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="bg-background py-8 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fundraisers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white border-border"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 px-4">
                  Sort by
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Most recent</DropdownMenuItem>
                <DropdownMenuItem>Most funded</DropdownMenuItem>
                <DropdownMenuItem>Close to goal</DropdownMenuItem>
                <DropdownMenuItem>Ending soon</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 px-4">
                  Location
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Near me</DropdownMenuItem>
                <DropdownMenuItem>United States</DropdownMenuItem>
                <DropdownMenuItem>Canada</DropdownMenuItem>
                <DropdownMenuItem>United Kingdom</DropdownMenuItem>
                <DropdownMenuItem>Worldwide</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="h-10 px-4 rounded-full"
          >
            All Categories
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(
                selectedCategory === category.name ? null : category.name
              )}
              className="h-10 px-4 rounded-full"
            >
              <span className="mr-2">{category.emoji}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Active Filter Indicator */}
        {selectedCategory && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              {categories.find(c => c.name === selectedCategory)?.emoji}
              {selectedCategory}
              <button
                onClick={() => setSelectedCategory(null)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}