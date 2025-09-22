import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { FollowButton } from './FollowButton';

interface Follower {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  follower_count: number;
  campaign_count: number;
}

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  maxItems?: number;
}

export function FollowersList({ userId, type, maxItems }: FollowersListProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscriptions and join with profiles
      const query = type === 'followers'
        ? supabase
            .from('subscriptions')
            .select(`
              follower_id,
              profiles!subscriptions_follower_id_fkey(id, name, email, avatar, role, follower_count, campaign_count)
            `)
            .eq('following_id', userId)
            .eq('following_type', 'user')
        : supabase
            .from('subscriptions')
            .select(`
              following_id,
              profiles!subscriptions_following_id_fkey(id, name, email, avatar, role, follower_count, campaign_count)
            `)
            .eq('follower_id', userId);

      const { data, error } = await query.limit(maxItems || 50);

      if (error) throw error;

      // Transform the data
      const transformedData = (data || [])
        .map(item => {
          const profile = type === 'followers' ? item.profiles : item.profiles;
          return profile ? {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            role: profile.role,
            follower_count: Number(profile.follower_count || 0),
            campaign_count: Number(profile.campaign_count || 0)
          } : null;
        })
        .filter((item): item is Follower => item !== null);

      setFollowers(transformedData);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [userId, type, maxItems]);

  const title = type === 'followers' ? 'Followers' : 'Following';
  const icon = type === 'followers' ? Users : Heart;
  const IconComponent = icon;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage message={error} onRetry={fetchFollowers} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          {title} ({followers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {followers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </div>
        ) : (
          <div className="space-y-3">
            {followers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={follower.avatar || undefined} />
                    <AvatarFallback>
                      {follower.name?.charAt(0)?.toUpperCase() || follower.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {follower.name || 'Anonymous User'}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {follower.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{follower.campaign_count} campaigns</span>
                      <span>{follower.follower_count} followers</span>
                    </div>
                  </div>
                </div>

                <FollowButton userId={follower.id} size="sm" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}