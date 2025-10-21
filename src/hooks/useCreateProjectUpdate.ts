/**
 * Hook for creating project updates with event publishing
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';
import { useToast } from '@/hooks/use-toast';
import { useEventPublisher } from '@/hooks/useEventBus';
import { createProjectUpdateCreatedEvent } from '@/lib/events/domain/ProjectEvents';
import type { ProjectUpdate } from '@/types/domain/project';

interface CreateUpdateInput {
  fundraiserId: string;
  title: string;
  body: string;
  authorId: string;
  milestoneId?: string;
  visibility: 'public' | 'donors_only';
  attachments?: Array<{ type: string; url: string }>;
  usedAI?: boolean;
}

export function useCreateProjectUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { publish } = useEventPublisher();

  const mutation = useMutation({
    mutationFn: async (input: CreateUpdateInput) => {
      // Create the update
      const update = await projectService.createUpdate({
        fundraiser_id: input.fundraiserId,
        title: input.title,
        body: input.body,
        author_id: input.authorId,
        milestone_id: input.milestoneId,
        visibility: input.visibility,
        attachments: input.attachments,
      });

      // Publish event
      const event = createProjectUpdateCreatedEvent({
        updateId: update.id,
        fundraiserId: input.fundraiserId,
        authorId: input.authorId,
        title: input.title,
        body: input.body,
        milestoneId: input.milestoneId,
        visibility: input.visibility,
        attachments: input.attachments as Array<{ type: 'image' | 'document'; url: string }> | undefined,
        usedAI: input.usedAI,
      });

      await publish(event);

      return update;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updates
      queryClient.invalidateQueries({ 
        queryKey: ['project-updates', variables.fundraiserId] 
      });

      toast({
        title: 'Update posted',
        description: 'Your project update has been posted successfully.',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create update:', error);
      toast({
        title: 'Failed to post update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createUpdate: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
