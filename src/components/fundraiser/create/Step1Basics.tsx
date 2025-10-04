/**
 * Step 1: Basics
 * Title, Category, Goal Amount
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategorySelector } from './CategorySelector';
import { CharacterCounter } from './CharacterCounter';

interface Step1BasicsProps {
  formData: {
    title?: string;
    categoryId?: string;
    goalAmount?: number;
  };
  errors: Record<string, string>;
  onChange: (updates: any) => void;
}

export function Step1Basics({ formData, errors, onChange }: Step1BasicsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="label-small">
          Fundraiser Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Give your fundraiser a compelling title"
          value={formData.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className={errors.title ? 'border-destructive' : ''}
          maxLength={100}
        />
        <CharacterCounter
          current={formData.title?.length || 0}
          min={5}
          max={100}
          showMinimum
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Choose a clear, specific title that captures attention
        </p>
      </div>

      <CategorySelector
        value={formData.categoryId}
        onChange={(categoryId) => onChange({ categoryId })}
        error={errors.categoryId}
      />

      <div className="space-y-2">
        <Label htmlFor="goalAmount" className="label-small">
          Goal Amount (USD) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="goalAmount"
            type="number"
            placeholder="10000"
            value={formData.goalAmount || ''}
            onChange={(e) => onChange({ goalAmount: parseFloat(e.target.value) || 0 })}
            className={errors.goalAmount ? 'border-destructive pl-7' : 'pl-7'}
            min={100}
            max={10000000}
            step={100}
          />
        </div>
        {errors.goalAmount && (
          <p className="text-sm text-destructive">{errors.goalAmount}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Set a realistic goal between $100 and $10,000,000
        </p>
      </div>
    </div>
  );
}
