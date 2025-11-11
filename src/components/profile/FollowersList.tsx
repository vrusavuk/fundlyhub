import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ProfileFollowerItemSkeleton } from '@/components/skeletons/ProfilePageSkeleton';
import { FollowButton } from './FollowButton';
import { FollowOrganizationButton } from './FollowOrganizationButton';
import { logger } from '@/lib/services/logger.service';

interface Follower {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  follower_count: number;
  campaign_count: number;
  type: 'user' | 'organization';
  legal_name?: string;
  dba_name?: string;
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
  const navigate = useNavigate();

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);

      let transformedData: Follower[] = [];

      if (type === 'followers') {
        // Use security definer function to get public followers
        const { data, error: fetchError } = await supabase
          .rpc('get_public_followers', {
            target_user_id: userId,
            limit_count: maxItems || 50
          });

        if (fetchError) {
          logger.error('Error fetching followers', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), {
            componentName: 'FollowersList',
            operationName: 'fetchFollowers',
            userId,
            type: 'followers'
          });
          throw fetchError;
        }

        transformedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          email: null,
          avatar: item.avatar,
          role: item.role,
          follower_count: Number(item.follower_count || 0),
          campaign_count: Number(item.campaign_count || 0),
          type: item.type as 'user' | 'organization',
          legal_name: undefined,
          dba_name: undefined
        }));
      } else {
        // Use security definer function to get public following
        const { data, error: fetchError } = await supabase
          .rpc('get_public_following', {
            target_user_id: userId,
            limit_count: maxItems || 50
          });

        if (fetchError) {
          logger.error('Error fetching following', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), {
            componentName: 'FollowersList',
            operationName: 'fetchFollowers',
            userId,
            type: 'following'
          });
          throw fetchError;
        }

        transformedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          email: null,
          avatar: item.avatar,
          role: item.role,
          follower_count: Number(item.follower_count || 0),
          campaign_count: Number(item.campaign_count || 0),
          type: item.type as 'user' | 'organization',
          legal_name: item.legal_name,
          dba_name: item.dba_name
        }));
      }

      setFollowers(transformedData);
    } catch (error) {
      logger.error('Error fetching followers', error instanceof Error ? error : new Error(String(error)), {
        componentName: 'FollowersList',
        operationName: 'fetchFollowers',
        userId,
        type
      });
      
      // Provide more helpful error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      
      if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        setError('Unable to view this information due to privacy settings');
      } else {
        setError('Failed to load followers. Please try again later.');
      }
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
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProfileFollowerItemSkeleton key={index} />
            ))}
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
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer" 
                  onClick={() => {
                    if (follower.type === 'organization') {
                      navigate(`/organization/${follower.id}`);
                    } else {
                      navigate(`/profile/${follower.id}`);
                    }
                  }}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={follower.avatar || undefined} />
                    <AvatarFallback>
                      {follower.type === 'organization' 
                        ? (follower.dba_name || follower.legal_name || 'O').charAt(0).toUpperCase()
                        : follower.name?.charAt(0)?.toUpperCase() || follower.email?.charAt(0)?.toUpperCase() || 'U'
                      }
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate hover:text-primary transition-colors">
                        {follower.type === 'organization' 
                          ? (follower.dba_name || follower.legal_name || 'Organization')
                          : (follower.name || 'Anonymous User')
                        }
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {follower.type === 'organization' ? 'org' : follower.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {follower.type === 'organization' ? (
                        <span>Organization</span>
                      ) : (
                        <>
                          <span>{follower.campaign_count} campaigns</span>
                          <span>{follower.follower_count} followers</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {follower.type === 'user' && <FollowButton userId={follower.id} size="sm" />}
                {follower.type === 'organization' && <FollowOrganizationButton organizationId={follower.id} size="sm" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}