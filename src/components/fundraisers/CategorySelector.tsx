/**
 * Category selection component with improved UX
 */
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, type CategoryName } from '@/types/fundraiser';

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategorySelector({
  selectedCategory,
  onCategoryChange,
  className
}: CategorySelectorProps) {
  const categories = ['All', ...CATEGORIES.map(c => c.name)];

  const getCategoryStyle = (categoryName: string) => {
    if (categoryName === 'All') {
      return selectedCategory === 'All' ? 'default' : 'outline';
    }
    
    const category = CATEGORIES.find(c => c.name === categoryName);
    return selectedCategory === categoryName ? 'default' : 'outline';
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories.map((category) => (
        <Badge
          key={category}
          variant={getCategoryStyle(category)}
          className="cursor-pointer transition-smooth hover:bg-primary hover:text-primary-foreground"
          onClick={() => onCategoryChange(category)}
        >
          {category !== 'All' && (
            <span className="mr-1">
              {CATEGORIES.find(c => c.name === category)?.emoji}
            </span>
          )}
          {category}
        </Badge>
      ))}
    </div>
  );
}