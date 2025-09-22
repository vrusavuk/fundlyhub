/**
 * Category selection component with improved UX
 */
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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
  const { categories: dbCategories, loading } = useCategories();
  const categories = ['All', ...dbCategories.map(c => c.name)];

  const getCategoryVariant = (categoryName: string) => {
    if (categoryName === 'All') {
      return selectedCategory === 'All' ? 'default' : 'outline';
    }
    
    return selectedCategory === categoryName ? 'default' : 'outline';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {categories.map((category) => (
        <Badge
          key={category}
          variant={getCategoryVariant(category)}
          className="cursor-pointer transition-smooth hover:bg-primary hover:text-primary-foreground"
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
}