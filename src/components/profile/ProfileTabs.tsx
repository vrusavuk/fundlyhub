import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FundraiserGrid } from '@/components/fundraisers/FundraiserGrid';
import { FollowersList } from './FollowersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Trophy } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { ProfileTabContentSkeleton } from '@/components/skeletons/ProfilePageSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import type { Fundraiser } from '@/types';

interface ProfileTabsProps {
  userId: string;
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;
  
  const [activeCampaigns, setActiveCampaigns] = useState<Fundraiser[]>([]);
  const [closedCampaigns, setClosedCampaigns] = useState<Fundraiser[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(true);

  // Fetch campaigns for the user
  useEffect(() => {
    const fetchCampaigns = async () => {
      setActiveLoading(true);
      setClosedLoading(true);

      try {
        // Fetch active campaigns - include all visibility types if viewing own profile
        let activeQuery = supabase
          .from('fundraisers')
          .select('*')
          .eq('owner_user_id', userId)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // If not own profile, only show public campaigns
        if (!isOwnProfile) {
          activeQuery = activeQuery.eq('visibility', 'public');
        }

        const { data: activeData, error: activeError } = await activeQuery;
        
        if (activeError) throw activeError;
        setActiveCampaigns((activeData as Fundraiser[]) || []);
        setActiveLoading(false);

        // Fetch closed/ended campaigns
        let closedQuery = supabase
          .from('fundraisers')
          .select('*')
          .eq('owner_user_id', userId)
          .in('status', ['ended', 'closed'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // If not own profile, only show public campaigns
        if (!isOwnProfile) {
          closedQuery = closedQuery.eq('visibility', 'public');
        }

        const { data: closedData, error: closedError } = await closedQuery;
        
        if (closedError) throw closedError;
        setClosedCampaigns((closedData as Fundraiser[]) || []);
        setClosedLoading(false);

      } catch (error) {
        console.error('Error fetching user campaigns:', error);
        setActiveLoading(false);
        setClosedLoading(false);
      }
    };

    fetchCampaigns();
  }, [userId, isOwnProfile]);

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="active" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <span className="hidden sm:inline">Active</span>
          <span className="sm:hidden">Active</span>
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <span className="hidden sm:inline">Completed</span>
          <span className="sm:hidden">Done</span>
        </TabsTrigger>
        <TabsTrigger value="supporters" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Supporters</span>
          <span className="sm:hidden">Fans</span>
        </TabsTrigger>
        <TabsTrigger value="supporting" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">Supporting</span>
          <span className="sm:hidden">Love</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Active Campaigns ({activeCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeLoading ? (
              <LoadingState variant="fundraiser-cards" count={3} />
            ) : activeCampaigns.length > 0 ? (
              <FundraiserGrid 
                fundraisers={activeCampaigns} 
                stats={{}}
                loading={activeLoading}
                error={null}
                onCardClick={(slug) => window.location.href = `/fundraiser/${slug}`}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active campaigns yet
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="completed">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Completed Campaigns ({closedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closedLoading ? (
              <LoadingState variant="fundraiser-cards" count={3} />
            ) : closedCampaigns.length > 0 ? (
              <FundraiserGrid 
                fundraisers={closedCampaigns} 
                stats={{}}
                loading={closedLoading}
                error={null}
                onCardClick={(slug) => window.location.href = `/fundraiser/${slug}`}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No completed campaigns yet
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="supporters">
        <FollowersList userId={userId} type="followers" />
      </TabsContent>

      <TabsContent value="supporting">
        <FollowersList userId={userId} type="following" />
      </TabsContent>
    </Tabs>
  );
}