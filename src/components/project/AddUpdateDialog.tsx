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
import { useProjectUpdateAI } from '@/hooks/useProjectUpdateAI';
import { useCreateProjectUpdate } from '@/hooks/useCreateProjectUpdate';
import { Loader2, Sparkles, Check, X } from 'lucide-react';
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

  const { enhanceText, isLoading: isAILoading } = useProjectUpdateAI();
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

  const handleGenerateAI = async () => {
    const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
    const action = currentBody?.trim() ? 'improve' : 'generate';
    
    const enhanced = await enhanceText(action, currentBody || '', {
      fundraiserTitle,
      fundraiserId,
      milestoneTitle: selectedMilestone?.title,
    });

    if (enhanced) {
      setBodySuggestion(enhanced);
      setUsedAI(true);
    }
  };

  const handleAcceptSuggestion = () => {
    if (bodySuggestion) {
      setValue('body', bodySuggestion);
      setBodySuggestion(null);
    }
  };

  const handleRejectSuggestion = () => {
    setBodySuggestion(null);
  };

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
              {!bodySuggestion && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateAI}
                  disabled={isAILoading}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                >
                  {isAILoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      {currentBody?.trim() ? 'Improve with AI' : 'Generate with AI'}
                    </>
                  )}
                </Button>
              )}
            </div>

            <Textarea
              id="body"
              {...register('body')}
              placeholder="Share what you've accomplished, challenges you've overcome, or what's coming next..."
              value={bodySuggestion || currentBody || ''}
              onChange={(e) => setValue('body', e.target.value)}
              className={`min-h-[200px] ${bodySuggestion ? 'border-primary border-2 bg-primary/5' : ''}`}
              maxLength={2000}
              readOnly={!!bodySuggestion}
            />

            {bodySuggestion && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleAcceptSuggestion}
                  className="gap-1"
                >
                  <Check className="h-3 w-3" />
                  Accept
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={isAILoading}
                  className="gap-1"
                >
                  {isAILoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Regenerate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRejectSuggestion}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

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
            <Button type="submit" disabled={isCreating || isAILoading}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Post Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
