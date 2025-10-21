/**
 * Hook for fetching project updates
 * NOTE: Use useCreateProjectUpdate hook for creating updates (event-driven)
 */

import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';
import type { ProjectUpdateWithRelations } from '@/types/domain/project';

export function useProjectUpdates(fundraiserId: string) {
  const updatesQuery = useQuery<ProjectUpdateWithRelations[]>({
    queryKey: ['project-updates', fundraiserId],
    queryFn: () => projectService.getUpdates(fundraiserId),
    enabled: !!fundraiserId,
  });

  return {
    updates: updatesQuery.data || [],
    isLoading: updatesQuery.isLoading,
    error: updatesQuery.error,
  };
}
