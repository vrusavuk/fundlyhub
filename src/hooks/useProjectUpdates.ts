/**
 * Hook for managing project updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';
import { useToast } from '@/hooks/use-toast';
import type { ProjectUpdate } from '@/types/domain/project';

export function useProjectUpdates(fundraiserId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatesQuery = useQuery({
    queryKey: ['project-updates', fundraiserId],
    queryFn: () => projectService.getUpdates(fundraiserId),
    enabled: !!fundraiserId,
  });

  const createMutation = useMutation({
    mutationFn: (update: Omit<ProjectUpdate, 'id' | 'created_at'>) =>
      projectService.createUpdate(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-updates', fundraiserId] });
      toast({
        title: 'Update posted',
        description: 'Your project update has been posted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error posting update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    updates: updatesQuery.data || [],
    isLoading: updatesQuery.isLoading,
    error: updatesQuery.error,
    createUpdate: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
