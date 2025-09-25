import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock,
  DollarSign,
  Heart,
  MessageCircle,
  Users,
  FileText,
  UserPlus,
  Activity,
  TrendingUp
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface UserActivity {
  id: string;
  activity_type: string;
  created_at: string;
  metadata: Record<string, any>;
  target_type?: string;
  target_id?: string;
}

interface UserActivityTimelineProps {
  userId: string;
}

export function UserActivityTimeline({ userId }: UserActivityTimelineProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivities();
  }, [userId]);

  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user activities',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'donation_made':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'campaign_created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'campaign_updated':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'user_followed':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'comment_posted':
        return <MessageCircle className="h-4 w-4 text-indigo-600" />;
      case 'campaign_liked':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'profile_updated':
        return <Users className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (activityType: string) => {
    const badgeMap = {
      donation_made: { variant: 'default' as const, label: 'Donation' },
      campaign_created: { variant: 'secondary' as const, label: 'Campaign' },
      campaign_updated: { variant: 'outline' as const, label: 'Update' },
      user_followed: { variant: 'default' as const, label: 'Follow' },
      comment_posted: { variant: 'secondary' as const, label: 'Comment' },
      campaign_liked: { variant: 'destructive' as const, label: 'Like' },
      profile_updated: { variant: 'outline' as const, label: 'Profile' }
    };

    const badge = badgeMap[activityType as keyof typeof badgeMap] || 
                  { variant: 'outline' as const, label: 'Activity' };

    return (
      <Badge variant={badge.variant} className="text-xs">
        {badge.label}
      </Badge>
    );
  };

  const formatActivityDescription = (activity: UserActivity) => {
    const { activity_type, metadata } = activity;
    
    switch (activity_type) {
      case 'donation_made':
        return `Made a donation of $${metadata.amount || 0} to ${metadata.campaign_title || 'a campaign'}`;
      case 'campaign_created':
        return `Created campaign "${metadata.title || 'Untitled Campaign'}"`;
      case 'campaign_updated':
        return `Updated campaign "${metadata.title || 'campaign'}"`;
      case 'user_followed':
        return `Started following ${metadata.target_name || 'a user'}`;
      case 'comment_posted':
        return `Posted a comment on "${metadata.campaign_title || 'a campaign'}"`;
      case 'campaign_liked':
        return `Liked campaign "${metadata.campaign_title || 'a campaign'}"`;
      case 'profile_updated':
        return 'Updated their profile information';
      default:
        return `Performed ${activity_type.replace('_', ' ')} action`;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-4 w-4" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Recent user activities and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No recent activity found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        {getActivityBadge(activity.activity_type)}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">
                      {formatActivityDescription(activity)}
                    </p>
                    {activity.metadata?.amount && (
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Amount: ${activity.metadata.amount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}