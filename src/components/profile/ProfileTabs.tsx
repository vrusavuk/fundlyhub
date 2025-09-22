import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FundraiserGrid } from '@/components/fundraisers/FundraiserGrid';
import { FollowersList } from './FollowersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Trophy } from 'lucide-react';
import { useFundraisers } from '@/hooks/useFundraisers';

interface ProfileTabsProps {
  userId: string;
}

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const { 
    fundraisers: activeCampaigns, 
    loading: activeLoading 
  } = useFundraisers({ 
    searchTerm: '',
    category: '',
    status: 'active'
  });

  const { 
    fundraisers: closedCampaigns, 
    loading: closedLoading 
  } = useFundraisers({ 
    searchTerm: '',
    category: '',
    status: 'ended'
  });

  // Filter campaigns by user
  const userActiveCampaigns = activeCampaigns.filter(f => f.owner_user_id === userId);
  const userClosedCampaigns = closedCampaigns.filter(f => f.owner_user_id === userId);

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
              Active Campaigns ({userActiveCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : userActiveCampaigns.length > 0 ? (
              <FundraiserGrid 
                fundraisers={userActiveCampaigns} 
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
              Completed Campaigns ({userClosedCampaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closedLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
            ) : userClosedCampaigns.length > 0 ? (
              <FundraiserGrid 
                fundraisers={userClosedCampaigns} 
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