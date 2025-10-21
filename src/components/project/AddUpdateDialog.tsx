/**
 * Dialog for adding project updates with AI enhancement
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AITextEnhancer } from '@/components/fundraiser/create/AITextEnhancer';
import { useCreateProjectUpdate } from '@/hooks/useCreateProjectUpdate';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectMilestone } from '@/types/domain/project';

const updateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  body: z.string().min(10, 'Update must be at least 10 characters').max(2000),
  visibility: z.enum(['public', 'donors_only']),
  milestoneId: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface AddUpdateDialogProps {
  fundraiserId: string;
  fundraiserTitle: string;
  authorId: string;
  milestones?: ProjectMilestone[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUpdateDialog({
  fundraiserId,
  fundraiserTitle,
  authorId,
  milestones = [],
  open,
  onOpenChange,
}: AddUpdateDialogProps) {
  const [bodySuggestion, setBodySuggestion] = useState<string | null>(null);
  const [usedAI, setUsedAI] = useState(false);

  const { createUpdate, isCreating } = useCreateProjectUpdate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      visibility: 'public',
      milestoneId: undefined,
    },
  });

  const currentBody = watch('body');
  const selectedMilestoneId = watch('milestoneId');

  const onSubmit = (data: UpdateFormData) => {
    createUpdate({
      fundraiserId,
      title: data.title,
      body: data.body,
      authorId,
      visibility: data.visibility,
      milestoneId: data.milestoneId,
      usedAI,
    });

    // Reset form and close dialog
    reset();
    setBodySuggestion(null);
    setUsedAI(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    setBodySuggestion(null);
    setUsedAI(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Project Update</DialogTitle>
          <DialogDescription>
            Share progress and updates with your supporters
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Update Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Milestone 1 Complete!"
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Milestone Selection */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="milestone">Related Milestone (Optional)</Label>
              <Select
                value={selectedMilestoneId || undefined}
                onValueChange={(value) => setValue('milestoneId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Body with AI Enhancement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Update Content *</Label>
              <AITextEnhancer
                field="story"
                currentText={currentBody || ''}
                onTextGenerated={(text) => {
                  setValue('body', text);
                  setBodySuggestion(null);
                  setUsedAI(true);
                }}
                onSuggestionChange={setBodySuggestion}
                context={{
                  title: fundraiserTitle,
                  category: 'project_update',
                  summary: selectedMilestoneId 
                    ? milestones.find(m => m.id === selectedMilestoneId)?.title 
                    : undefined,
                }}
              />
            </div>

            <Textarea
              id="body"
              {...register('body')}
              placeholder="Share what you've accomplished, challenges you've overcome, or what's coming next..."
              value={bodySuggestion || currentBody || ''}
              onChange={(e) => setValue('body', e.target.value)}
              className={cn(
                'min-h-[200px]',
                errors.body && 'border-destructive',
                bodySuggestion && 'border-primary border-2 bg-primary/5'
              )}
              maxLength={2000}
              readOnly={!!bodySuggestion}
            />

            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {(bodySuggestion || currentBody || '').length} / 2000 characters
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility *</Label>
            <Select
              value={watch('visibility')}
              onValueChange={(value) => setValue('visibility', value as 'public' | 'donors_only')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Everyone can see</SelectItem>
                <SelectItem value="donors_only">Donors Only - Only supporters can see</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Post Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
