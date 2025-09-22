import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Trophy, UserPlus, RefreshCw } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  userId?: string;
  showHeader?: boolean;
  maxItems?: number;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'campaign_created':
      return <Trophy className="h-4 w-4 text-primary" />;
    case 'donation_made':
      return <Heart className="h-4 w-4 text-red-500" />;
    case 'followed_user':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'followed_organization':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    default:
      return <Trophy className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActivityMessage = (activityType: string) => {
  switch (activityType) {
    case 'campaign_created':
      return 'created a new campaign';
    case 'donation_made':
      return 'made a donation';
    case 'followed_user':
      return 'followed a user';
    case 'followed_organization':
      return 'followed an organization';
    default:
      return 'performed an action';
  }
};

export function ActivityFeed({ userId, showHeader = true, maxItems }: ActivityFeedProps) {
  const { activities, loading, error, hasMore, loadMore, refresh } = useActivityFeed(userId);

  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  if (loading && activities.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <LoadingState variant="activity-items" count={5} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ErrorMessage message={error} onRetry={refresh} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Activity Feed
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
      )}
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity to show
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activity.actor_avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {activity.actor_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.activity_type)}
                    <span className="font-medium text-sm truncate">
                      {activity.actor_name || 'Someone'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getActivityMessage(activity.activity_type)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {activity.activity_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {!maxItems && hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Load More Activity'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}