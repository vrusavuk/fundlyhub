/**
 * Hook for managing project milestones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';
import { useToast } from '@/hooks/use-toast';
import type { ProjectMilestone } from '@/types/domain/project';

export function useProjectMilestones(fundraiserId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const milestonesQuery = useQuery({
    queryKey: ['project-milestones', fundraiserId],
    queryFn: () => projectService.getMilestones(fundraiserId),
    enabled: !!fundraiserId,
  });

  const createMutation = useMutation({
    mutationFn: (milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>) =>
      projectService.createMilestone(milestone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', fundraiserId] });
      toast({
        title: 'Milestone created',
        description: 'The milestone has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating milestone',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ 
      milestoneId, 
      status, 
      proofUrls 
    }: { 
      milestoneId: string; 
      status: ProjectMilestone['status']; 
      proofUrls?: string[] 
    }) => projectService.updateMilestoneStatus(milestoneId, status, proofUrls),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', fundraiserId] });
      toast({
        title: 'Milestone updated',
        description: 'The milestone status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating milestone',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    milestones: milestonesQuery.data || [],
    isLoading: milestonesQuery.isLoading,
    error: milestonesQuery.error,
    createMilestone: createMutation.mutate,
    updateMilestoneStatus: updateStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
  };
}
