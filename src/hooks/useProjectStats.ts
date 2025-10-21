/**
 * Hook for fetching project statistics
 */

import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/project.service';

export function useProjectStats(fundraiserId: string) {
  const statsQuery = useQuery({
    queryKey: ['project-stats', fundraiserId],
    queryFn: () => projectService.getProjectStats(fundraiserId),
    enabled: !!fundraiserId,
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
  };
}
