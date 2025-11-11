/**
 * Step 1: Basics
 * Title, Category, Goal Amount
 */

import { Input } from '@/components/ui/input';
import { CategorySelector } from './CategorySelector';
import { CharacterCounter } from './CharacterCounter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Globe, Link2, Lock, Info, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FieldLabel } from './FieldLabel';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY, WIZARD_ICONS, WIZARD_ALERTS, WIZARD_GAPS } from './designConstants';

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
    <div className={WIZARD_SPACING.stepContainer}>
      <div className={WIZARD_SPACING.fieldGroup}>
        <FieldLabel htmlFor="title" required>
          Fundraiser Title
        </FieldLabel>
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
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.title}</p>
        )}
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          Choose a clear, specific title that captures attention
        </p>
      </div>

      <CategorySelector
        value={formData.categoryId}
        onChange={(categoryId) => onChange({ categoryId })}
        error={errors.categoryId}
      />

      <div className={WIZARD_SPACING.fieldGroup}>
        <FieldLabel htmlFor="goalAmount" required>
          Goal Amount (USD)
        </FieldLabel>
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
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.goalAmount}</p>
        )}
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          Set a realistic goal between $100 and $10,000,000
        </p>
      </div>

      <div className={WIZARD_SPACING.fieldGroup}>
        <FieldLabel htmlFor="type" required>
          Fundraiser Type
        </FieldLabel>
        <RadioGroup
          value={formData.type || 'personal'}
          onValueChange={(value) => onChange({ type: value as 'personal' | 'charity' })}
          className={`flex ${WIZARD_GAPS.standard}`}
        >
          <div className={`flex items-center ${WIZARD_GAPS.inline} flex-1 cursor-pointer rounded-lg border p-3 hover:border-primary/50 transition-colors`}>
            <RadioGroupItem value="personal" id="type-personal" />
            <Label htmlFor="type-personal" className="cursor-pointer flex-1">
              <div className="font-medium">Personal</div>
              <div className={WIZARD_TYPOGRAPHY.helperText}>Not tax-deductible</div>
            </Label>
          </div>
          <div className={`flex items-center ${WIZARD_GAPS.inline} flex-1 cursor-pointer rounded-lg border p-3 hover:border-primary/50 transition-colors`}>
            <RadioGroupItem value="charity" id="type-charity" />
            <Label htmlFor="type-charity" className="cursor-pointer flex-1">
              <div className={`font-medium flex items-center ${WIZARD_GAPS.inline}`}>
                Charity
                <Badge variant="default" className={WIZARD_TYPOGRAPHY.helperText}>Tax-deductible</Badge>
              </div>
              <div className={WIZARD_TYPOGRAPHY.helperText}>501(c)(3) certified</div>
            </Label>
          </div>
        </RadioGroup>
        {errors.type && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.type}</p>
        )}
      </div>

      <div className={WIZARD_SPACING.fieldGroup}>
        <FieldLabel htmlFor="visibility" required>
          Privacy & Visibility
        </FieldLabel>
        <Select
          value={formData.visibility || 'public'}
          onValueChange={(value) => onChange({ visibility: value as 'public' | 'unlisted' | 'private' })}
        >
          <SelectTrigger id="visibility" className={errors.visibility ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select visibility">
              {formData.visibility === 'public' && (
                <span className={`flex items-center ${WIZARD_GAPS.inline}`}>
                  <Globe className={WIZARD_ICONS.standard} />
                  <span>Public</span>
                </span>
              )}
              {formData.visibility === 'unlisted' && (
                <span className={`flex items-center ${WIZARD_GAPS.inline}`}>
                  <Link2 className={WIZARD_ICONS.standard} />
                  <span>Unlisted</span>
                </span>
              )}
              {formData.visibility === 'private' && (
                <span className={`flex items-center ${WIZARD_GAPS.inline}`}>
                  <Lock className={WIZARD_ICONS.standard} />
                  <span>Private</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="public">
              <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                <Globe className={WIZARD_ICONS.standard} />
                <span>Public</span>
              </div>
            </SelectItem>
            <SelectItem value="unlisted">
              <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                <Link2 className={WIZARD_ICONS.standard} />
                <span>Unlisted</span>
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                <Lock className={WIZARD_ICONS.standard} />
                <span>Private</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.visibility && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.visibility}</p>
        )}
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          {formData.visibility === 'public' && 'Visible in search and discovery'}
          {formData.visibility === 'unlisted' && 'Only accessible via link'}
          {formData.visibility === 'private' && 'Requires access code or invite'}
        </p>
      </div>

      {formData.visibility === 'private' && (
        <Alert className={WIZARD_ALERTS.info}>
          <Shield className={WIZARD_ALERTS.icon} />
          <AlertDescription className={WIZARD_SPACING.alertContent}>
            <p className={WIZARD_TYPOGRAPHY.bodyText}>
              Configure access controls for your private fundraiser
            </p>
            
            <div className={WIZARD_SPACING.cardSubsection}>
              <div className={WIZARD_SPACING.fieldGroup}>
                <Label htmlFor="passcode" className={WIZARD_TYPOGRAPHY.fieldLabel}>
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
                  <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.passcode}</p>
                )}
                <p className={WIZARD_TYPOGRAPHY.helperText}>
                  Anyone with this passcode can access your fundraiser
                </p>
              </div>

              <div className={WIZARD_SPACING.fieldGroup}>
                <Label htmlFor="allowlistEmails" className={WIZARD_TYPOGRAPHY.fieldLabel}>
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
                  <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.allowlistEmails}</p>
                )}
                <p className={WIZARD_TYPOGRAPHY.helperText}>
                  Only these email addresses can access your fundraiser
                </p>
              </div>
            </div>

            <div className={`flex items-start ${WIZARD_GAPS.inline} p-3 rounded-md bg-background`}>
              <Info className={`${WIZARD_ICONS.standard} mt-0.5 text-muted-foreground`} />
              <p className={WIZARD_TYPOGRAPHY.helperText}>
                If no access controls are set, anyone with the link can access your private fundraiser.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
