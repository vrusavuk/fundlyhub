/**
 * Step 1: Basics
 * Title, Category, Goal Amount
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategorySelector } from './CategorySelector';
import { CharacterCounter } from './CharacterCounter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Link2, Lock, Info, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Step1BasicsProps {
  formData: {
    title?: string;
    categoryId?: string;
    goalAmount?: number;
    type?: 'personal' | 'charity';
    visibility?: 'public' | 'unlisted' | 'private';
    passcode?: string;
    allowlistEmails?: string;
  };
  errors: Record<string, string>;
  onChange: (updates: any) => void;
}

export function Step1Basics({ formData, errors, onChange }: Step1BasicsProps) {
  return (
    <div className="component-hierarchy">
      <div className="stripe-space-sm">
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
        <p className="text-xs text-muted-foreground mt-1">
          Choose a clear, specific title that captures attention
        </p>
      </div>

      <CategorySelector
        value={formData.categoryId}
        onChange={(categoryId) => onChange({ categoryId })}
        error={errors.categoryId}
      />

      <div className="stripe-space-sm">
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
        <p className="text-xs text-muted-foreground mt-1">
          Set a realistic goal between $100 and $10,000,000
        </p>
      </div>

      <div className="stripe-space-sm">
        <Label className="label-small">
          Fundraiser Type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={formData.type || 'personal'}
          onValueChange={(value) => onChange({ type: value as 'personal' | 'charity' })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2 flex-1 cursor-pointer rounded-lg border p-3 hover:border-primary/50 transition-colors">
            <RadioGroupItem value="personal" id="type-personal" />
            <Label htmlFor="type-personal" className="cursor-pointer flex-1">
              <div className="font-medium">Personal</div>
              <div className="text-xs text-muted-foreground">Not tax-deductible</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 flex-1 cursor-pointer rounded-lg border p-3 hover:border-primary/50 transition-colors">
            <RadioGroupItem value="charity" id="type-charity" />
            <Label htmlFor="type-charity" className="cursor-pointer flex-1">
              <div className="font-medium flex items-center gap-2">
                Charity
                <Badge variant="default" className="text-xs">Tax-deductible</Badge>
              </div>
              <div className="text-xs text-muted-foreground">501(c)(3) certified</div>
            </Label>
          </div>
        </RadioGroup>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type}</p>
        )}
      </div>

      <div className="stripe-space-sm">
        <Label htmlFor="visibility" className="label-small">
          Privacy & Visibility <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.visibility || 'public'}
          onValueChange={(value) => onChange({ visibility: value as 'public' | 'unlisted' | 'private' })}
        >
          <SelectTrigger id="visibility" className={errors.visibility ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select visibility">
              {formData.visibility === 'public' && (
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Public</span>
                </span>
              )}
              {formData.visibility === 'unlisted' && (
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span>Unlisted</span>
                </span>
              )}
              {formData.visibility === 'private' && (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Private</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Public</span>
              </div>
            </SelectItem>
            <SelectItem value="unlisted">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span>Unlisted</span>
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Private</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.visibility && (
          <p className="text-sm text-destructive">{errors.visibility}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formData.visibility === 'public' && 'Visible in search and discovery'}
          {formData.visibility === 'unlisted' && 'Only accessible via link'}
          {formData.visibility === 'private' && 'Requires access code or invite'}
        </p>
      </div>

      {formData.visibility === 'private' && (
        <Alert className="border-primary/20 bg-primary/5 p-4">
          <Shield className="h-4 w-4" />
          <AlertDescription className="stripe-space-lg">
            <p className="text-sm">
              Configure access controls for your private fundraiser
            </p>
            
            <div className="stripe-space-md">
              <div className="stripe-space-sm">
                <Label htmlFor="passcode" className="text-sm">
                  Access Passcode (optional)
                </Label>
                <Input
                  id="passcode"
                  type="password"
                  placeholder="Enter a secure passcode (6-50 characters)"
                  value={formData.passcode || ''}
                  onChange={(e) => onChange({ passcode: e.target.value })}
                  className={errors.passcode ? 'border-destructive' : ''}
                  maxLength={50}
                />
                {errors.passcode && (
                  <p className="text-sm text-destructive">{errors.passcode}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Anyone with this passcode can access your fundraiser
                </p>
              </div>

              <div className="stripe-space-sm">
                <Label htmlFor="allowlistEmails" className="text-sm">
                  Allowlist Emails (optional)
                </Label>
                <Textarea
                  id="allowlistEmails"
                  placeholder="Enter email addresses (comma-separated)&#10;example: john@example.com, jane@example.com"
                  value={formData.allowlistEmails || ''}
                  onChange={(e) => onChange({ allowlistEmails: e.target.value })}
                  className={errors.allowlistEmails ? 'border-destructive' : ''}
                  rows={3}
                />
                {errors.allowlistEmails && (
                  <p className="text-sm text-destructive">{errors.allowlistEmails}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Only these email addresses can access your fundraiser
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-background">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                If no access controls are set, anyone with the link can access your private fundraiser.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
