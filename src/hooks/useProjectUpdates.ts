/**
 * Hook for fetching project updates
 * NOTE: Use useCreateProjectUpdate hook for creating updates (event-driven)
 */

import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';

export function useProjectUpdates(fundraiserId: string) {
  const updatesQuery = useQuery({
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
