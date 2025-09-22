import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar: string | null;
  activity_type: string;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface UseActivityFeedReturn {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function useActivityFeed(userId?: string): UseActivityFeedReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchActivities = async (reset = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const limit = 20;

      // For now, return empty activities since RPC function doesn't exist yet
      // TODO: Implement this when the database function is properly created
      const data: ActivityItem[] = [];
      const error = null;

      if (error) throw error;

      const newActivities = data || [];
      
      if (reset) {
        setActivities(newActivities);
        setOffset(newActivities.length);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
        setOffset(prev => prev + newActivities.length);
      }

      setHasMore(newActivities.length === limit);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      setError(error instanceof Error ? error.message : 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, [userId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  };

  const refresh = () => {
    setOffset(0);
    fetchActivities(true);
  };

  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}