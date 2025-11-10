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
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="beneficiaryName" className="label-small">
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
          <p className="text-sm text-destructive">{errors.beneficiaryName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Name the person or group who will receive the funds
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="label-small">
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
          <p className="text-sm text-destructive">{errors.location}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Optional: Where is this fundraiser located?
        </p>
      </div>

      <div className="space-y-2">
        <ImageUpload
          value={formData.coverImage}
          onChange={(url) => onChange({ coverImage: url })}
          onImageIdChange={(imageId) => onChange({ coverImageId: imageId })}
          maxFiles={1}
          bucket={formData.isProject ? 'fundraiser-images' : 'fundraiser-drafts'}
          isDraft={!formData.isProject}
          label="Cover Image"
          description="Upload a compelling image for your campaign (JPG, PNG, WebP, or GIF, max 5MB)"
          showPreview={true}
        />
        {errors.coverImage && (
          <p className="text-sm text-destructive">{errors.coverImage}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="label-small">End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
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
        <p className="text-xs text-muted-foreground">
          Optional: Set an end date for your campaign. Leave blank for ongoing campaigns.
        </p>
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">Optional fields help build trust:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Adding a beneficiary name personalizes your campaign</li>
          <li>Location helps donors connect with local causes</li>
          <li>A compelling image significantly increases donations</li>
          <li>End dates can create urgency for time-sensitive needs</li>
        </ul>
      </div>
    </div>
  );
}
