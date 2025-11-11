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
    <div className="space-y-4">
      <div className="space-y-1.5">
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
        <p className="text-[11px] text-muted-foreground mt-1">
          Optional: Name the person or group who will receive the funds
        </p>
      </div>

      <div className="space-y-1.5">
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
        <p className="text-[11px] text-muted-foreground mt-1">
          Optional: Where is this fundraiser located?
        </p>
      </div>

      <div className="space-y-1.5">
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
          <p className="text-sm text-destructive">{errors.coverImage}</p>
        )}
      </div>

      <div className="space-y-1.5">
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
        <p className="text-[11px] text-muted-foreground mt-1">
          Optional: Set an end date for your campaign
        </p>
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-3">
        <h4 className="font-medium text-xs sm:text-sm mb-1.5">Optional fields build trust:</h4>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>Beneficiary name personalizes campaign</li>
          <li>Location connects with local donors</li>
          <li>Images increase donations</li>
        </ul>
      </div>
    </div>
  );
}
