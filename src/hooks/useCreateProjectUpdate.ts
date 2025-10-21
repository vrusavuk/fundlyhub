/**
 * Hook for creating project updates with event publishing
 * Following event-driven architecture - no direct DB writes
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useEventPublisher } from '@/hooks/useEventBus';
import { createProjectUpdateCreatedEvent } from '@/lib/events/domain/ProjectEvents';

interface CreateUpdateInput {
  fundraiserId: string;
  title: string;
  body: string;
  authorId: string;
  milestoneId?: string;
  visibility: 'public' | 'donors_only';
  usedAI?: boolean;
}

export function useCreateProjectUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { publish } = useEventPublisher();

  const mutation = useMutation({
    mutationFn: async (input: CreateUpdateInput) => {
      // Generate UUID for the update (deterministic ID before DB write)
      const updateId = crypto.randomUUID();
      
      // Create and publish event - DB write happens in processor
      const event = createProjectUpdateCreatedEvent({
        updateId,
        fundraiserId: input.fundraiserId,
        authorId: input.authorId,
        title: input.title,
        body: input.body,
        milestoneId: input.milestoneId,
        visibility: input.visibility,
        usedAI: input.usedAI,
      });

      await publish(event);
      
      return { updateId };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch updates
      queryClient.invalidateQueries({ 
        queryKey: ['project-updates', variables.fundraiserId] 
      });
      
      toast({
        title: 'Update posted successfully',
        description: 'Your project update is now visible to supporters',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to create project update:', error);
      toast({
        title: 'Failed to post update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createUpdate: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
