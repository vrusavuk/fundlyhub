/**
 * Category Selector Component
 * Dynamic category selection using database categories
 */

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

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
    <div className="space-y-3">
      <Label className="label-small">
        Category <span className="text-destructive">*</span>
      </Label>
      
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className={cn(
              'relative cursor-pointer transition-all hover:shadow-md',
              value === category.id && 'ring-2 ring-primary shadow-glow'
            )}
          >
            <RadioGroupItem
              value={category.id}
              id={category.id}
              className="sr-only"
            />
            <Label
              htmlFor={category.id}
              className="flex flex-col items-center gap-2 p-4 cursor-pointer"
            >
              <span className="text-3xl" aria-hidden="true">
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-center">
                {category.name}
              </span>
            </Label>
          </Card>
        ))}
      </RadioGroup>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
