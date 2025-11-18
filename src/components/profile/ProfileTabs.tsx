import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FundraiserGrid } from '@/components/fundraisers/FundraiserGrid';
import { FollowersList } from './FollowersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Trophy, Wallet } from 'lucide-react';
import { EarningsTab } from './EarningsTab';
import { LoadingState } from '@/components/common/LoadingState';
import { ProfileTabContentSkeleton } from '@/components/skeletons/ProfilePageSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import type { Fundraiser } from '@/types';
import { logger } from '@/lib/services/logger.service';
import { fundraiserService } from '@/lib/services/fundraiser.service';
import { useToast } from '@/hooks/use-toast';

interface ProfileTabsProps {
  userId: string;
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwnProfile = user?.id === userId;
  
  const [allCampaigns, setAllCampaigns] = useState<Fundraiser[]>([]);
  const [closedCampaigns, setClosedCampaigns] = useState<Fundraiser[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, any>>({});
  const [allLoading, setAllLoading] = useState(true);
  const [closedLoading, setClosedLoading] = useState(true);

  // Fetch campaigns for the user using the single source of truth
  useEffect(() => {
    const fetchCampaigns = async () => {
      setAllLoading(true);
      setClosedLoading(true);

      try {
        console.log('[ProfileTabs] Fetching campaigns for user:', userId, 'isOwnProfile:', isOwnProfile);

        // Fetch active/draft/paused campaigns
        const activeResult = await fundraiserService.getUserCampaigns(userId, {
          statuses: isOwnProfile ? ['draft', 'active', 'paused'] : ['active'],
          includePrivate: isOwnProfile,
          limit: 50,
        });

        console.log('[ProfileTabs] ✅ Active campaigns fetched:', activeResult.data.length);
        setAllCampaigns(activeResult.data);
        setAllLoading(false);

        // Fetch closed/ended campaigns
        const closedResult = await fundraiserService.getUserCampaigns(userId, {
          statuses: ['ended', 'closed'],
          includePrivate: isOwnProfile,
          limit: 50,
        });

        console.log('[ProfileTabs] ✅ Closed campaigns fetched:', closedResult.data.length);
        setClosedCampaigns(closedResult.data);
        setClosedLoading(false);

        // Fetch stats for all campaigns
        const allIds = [...activeResult.data, ...closedResult.data].map(c => c.id);
        if (allIds.length > 0) {
          const stats = await fundraiserService.getFundraiserStats(allIds);
          console.log('[ProfileTabs] ✅ Campaign stats fetched:', Object.keys(stats).length);
          setCampaignStats(stats);
        }

      } catch (error) {
        console.error('[ProfileTabs] ❌ Error fetching campaigns:', error);
        logger.error('Error fetching user campaigns', error instanceof Error ? error : new Error(String(error)), {
          componentName: 'ProfileTabs',
          operationName: 'fetchCampaigns',
          userId,
          isOwnProfile
        });
        
        toast({
          title: "Unable to Load Campaigns",
          description: "Failed to load campaign data. Please try again.",
          variant: "destructive",
        });
        
        setAllLoading(false);
        setClosedLoading(false);
      }
    };

    fetchCampaigns();
  }, [userId, isOwnProfile, toast]);

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
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
        {isOwnProfile && (
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Earnings</span>
            <span className="sm:hidden">$$$</span>
          </TabsTrigger>
        )}
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
                stats={campaignStats}
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
                stats={campaignStats}
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

      {isOwnProfile && (
        <TabsContent value="earnings">
          <EarningsTab userId={userId} />
        </TabsContent>
      )}

      <TabsContent value="supporters">
        <FollowersList userId={userId} type="followers" />
      </TabsContent>

      <TabsContent value="supporting">
        <FollowersList userId={userId} type="following" />
      </TabsContent>
    </Tabs>
  );
}