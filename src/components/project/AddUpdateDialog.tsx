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
  const [suggestion, setSuggestion] = useState<string | null>(null);
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
    },
  });

  const currentBody = watch('body');
  const selectedMilestoneId = watch('milestoneId');

  const handleGenerateWithAI = async () => {
    const selectedMilestone = milestones.find(m => m.id === selectedMilestoneId);
    
    const enhanced = await enhanceText('generate', '', {
      fundraiserTitle,
      fundraiserId,
      milestoneTitle: selectedMilestone?.title,
    });

    if (enhanced) {
      setSuggestion(enhanced);
      setUsedAI(true);
    }
  };

  const handleImproveWithAI = async () => {
    if (!currentBody) return;

    const enhanced = await enhanceText('improve', currentBody, {
      fundraiserTitle,
      fundraiserId,
    });

    if (enhanced) {
      setSuggestion(enhanced);
      setUsedAI(true);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      setValue('body', suggestion);
      setSuggestion(null);
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestion(null);
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
    setSuggestion(null);
    setUsedAI(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    setSuggestion(null);
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
                value={selectedMilestoneId}
                onValueChange={(value) => setValue('milestoneId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Update Content *</Label>
              <div className="flex gap-2">
                {!currentBody && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateWithAI}
                    disabled={isAILoading}
                  >
                    {isAILoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate with AI
                  </Button>
                )}
                {currentBody && !suggestion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImproveWithAI}
                    disabled={isAILoading}
                  >
                    {isAILoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Improve with AI
                  </Button>
                )}
              </div>
            </div>

            {suggestion ? (
              <div className="space-y-3">
                <Textarea
                  value={suggestion}
                  readOnly
                  className="min-h-[200px] border-primary border-2 bg-primary/5"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAcceptSuggestion}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRejectSuggestion}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <Textarea
                id="body"
                {...register('body')}
                placeholder="Share what you've accomplished, challenges you've overcome, or what's coming next..."
                className="min-h-[200px]"
                maxLength={2000}
              />
            )}
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {currentBody?.length || 0} / 2000 characters
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
