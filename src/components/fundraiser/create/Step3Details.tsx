/**
 * Step 3: Details
 * Beneficiary, Location, Images, End Date
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TipsBox } from './TipsBox';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY, WIZARD_ICONS } from './designConstants';

interface Step3DetailsProps {
  formData: {
    beneficiaryName?: string;
    location?: string;
    coverImage?: string;
    coverImageId?: string;
    endDate?: string;
    isProject?: boolean;
  };
  errors: Record<string, string>;
  onChange: (updates: any) => void;
  isProject?: boolean;
}

export function Step3Details({ formData, errors, onChange, isProject }: Step3DetailsProps) {
  const selectedDate = formData.endDate ? new Date(formData.endDate) : undefined;

  return (
    <div className={WIZARD_SPACING.stepContainer}>
      <div className={WIZARD_SPACING.fieldGroup}>
        <Label htmlFor="beneficiaryName" className={WIZARD_TYPOGRAPHY.fieldLabel}>
          Beneficiary Name
        </Label>
        <Input
          id="beneficiaryName"
          placeholder="Who will benefit from this fundraiser?"
          value={formData.beneficiaryName || ''}
          onChange={(e) => onChange({ beneficiaryName: e.target.value })}
          className={errors.beneficiaryName ? 'border-destructive' : ''}
          maxLength={100}
        />
        {errors.beneficiaryName && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.beneficiaryName}</p>
        )}
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          Optional: Name the person or group who will receive the funds
        </p>
      </div>

      <div className={WIZARD_SPACING.fieldGroup}>
        <Label htmlFor="location" className={WIZARD_TYPOGRAPHY.fieldLabel}>
          Location
        </Label>
        <Input
          id="location"
          placeholder="City, State/Country"
          value={formData.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          className={errors.location ? 'border-destructive' : ''}
          maxLength={100}
        />
        {errors.location && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.location}</p>
        )}
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          Optional: Where is this fundraiser located?
        </p>
      </div>

      <div className={WIZARD_SPACING.fieldGroup}>
        <ImageUpload
          value={formData.coverImage}
          onChange={(url) => {
            const imageUrl = typeof url === 'string' ? url : '';
            onChange({ coverImage: imageUrl || undefined });
          }}
          onImageIdChange={(imageId) => {
            const id = typeof imageId === 'string' ? imageId : '';
            onChange({ coverImageId: id || undefined });
          }}
          maxFiles={1}
          bucket={formData.isProject ? 'fundraiser-images' : 'fundraiser-drafts'}
          isDraft={!formData.isProject}
          label="Cover Image"
          description="Upload a compelling image for your campaign (JPG, PNG, WebP, or GIF, max 5MB)"
          showPreview={true}
        />
        {errors.coverImage && (
          <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-destructive`}>{errors.coverImage}</p>
        )}
      </div>

      <div className={WIZARD_SPACING.fieldGroup}>
        <Label className={WIZARD_TYPOGRAPHY.fieldLabel}>End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className={`mr-2 ${WIZARD_ICONS.standard}`} />
              {selectedDate ? format(selectedDate, 'PPP') : 'No end date (ongoing)'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => onChange({ endDate: date?.toISOString() })}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className={WIZARD_TYPOGRAPHY.helperText}>
          Optional: Set an end date for your campaign
        </p>
      </div>

      <TipsBox
        title="Optional fields build trust:"
        tips={[
          'Beneficiary name personalizes campaign',
          'Location connects with local donors',
          'Images increase donations',
        ]}
      />
    </div>
  );
}
