/**
 * Category Selector Component
 * Compact dropdown for category selection
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCategories } from '@/hooks/useCategories';

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  error?: string;
}

export function CategorySelector({ value, onChange, error }: CategorySelectorProps) {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="label-small">
        Category <span className="text-destructive">*</span>
      </Label>
      
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger id="category" className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select a category">
            {value && categories.find(c => c.id === value) && (
              <span className="flex items-center gap-2">
                <span>{categories.find(c => c.id === value)?.emoji}</span>
                <span>{categories.find(c => c.id === value)?.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
