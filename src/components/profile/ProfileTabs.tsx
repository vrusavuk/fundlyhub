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
  
  const [allCampaigns, setAllCampaigns] = useState<Fundraiser[]>([]);
  const [closedCampaigns, setClosedCampaigns] = useState<Fundraiser[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(true);

  // Fetch campaigns for the user
  useEffect(() => {
    const fetchCampaigns = async () => {
      setAllLoading(true);
      setClosedLoading(true);

      try {
        // Fetch all campaigns (draft, active, paused) - include all visibility types if viewing own profile
        let allQuery = supabase
          .from('fundraisers')
          .select('*')
          .eq('owner_user_id', userId)
          .in('status', ['draft', 'active', 'paused'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        // If not own profile, only show public active campaigns
        if (!isOwnProfile) {
          allQuery = allQuery.eq('visibility', 'public').eq('status', 'active');
        }

        const { data: allData, error: allError } = await allQuery;
        
        if (allError) throw allError;
        setAllCampaigns((allData as Fundraiser[]) || []);
        setAllLoading(false);

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
        setAllLoading(false);
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
          <span className="hidden sm:inline">Campaigns</span>
          <span className="sm:hidden">All</span>
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
              All Campaigns ({allCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allLoading ? (
              <LoadingState variant="fundraiser-cards" count={3} />
            ) : allCampaigns.length > 0 ? (
              <FundraiserGrid 
                fundraisers={allCampaigns} 
                stats={{}}
                loading={allLoading}
                error={null}
                showStatus={isOwnProfile}
                onCardClick={(slug) => window.location.href = `/fundraiser/${slug}`}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns yet
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