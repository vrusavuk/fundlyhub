/**
 * Organization Profile page showing organization information and campaigns
 */
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { FollowOrganizationButton } from '@/components/profile/FollowOrganizationButton';
import { FundraiserGrid } from '@/components/fundraisers/FundraiserGrid';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Globe, Calendar, Building2, Users, Trophy } from 'lucide-react';
import { useFundraisers } from '@/hooks/useFundraisers';
import { formatCurrency } from '@/lib/utils/formatters';
import { format } from 'date-fns';

interface Organization {
  id: string;
  legal_name: string;
  dba_name: string | null;
  website: string | null;
  country: string | null;
  categories: string[];
  verification_status: string;
  created_at: string;
}

export function OrganizationProfile() {
  const { orgId } = useParams<{ orgId: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);

  // Fetch organization campaigns
  const { 
    fundraisers: campaigns, 
    loading: campaignsLoading,
    error: campaignsError
  } = useFundraisers({ 
    searchTerm: '',
    category: '',
    status: 'active'
  });

  const organizationCampaigns = campaigns.filter(f => f.org_id === orgId);

  useEffect(() => {
    if (orgId) {
      fetchOrganization();
      fetchFollowerCount();
    }
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;

      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      setError(error instanceof Error ? error.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', orgId)
        .eq('following_type', 'organization');

      if (error) throw error;

      setFollowerCount(count || 0);
    } catch (error) {
      console.error('Error fetching follower count:', error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (error || !organization) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage message={error || "Organization not found"} />
        </PageContainer>
      </AppLayout>
    );
  }

  const joinDate = format(new Date(organization.created_at), 'MMMM yyyy');
  const totalFundsRaised = organizationCampaigns.reduce((sum, campaign) => {
    // This would come from donation totals in a real implementation
    return sum + Math.random() * 10000; // Mock data
  }, 0);

  return (
    <AppLayout>
      <PageContainer className="max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Organization Header */}
          <Card className="border-0 shadow-none bg-gradient-subtle">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center sm:items-start gap-4">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
                    <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-primary-foreground">
                      {organization.dba_name?.charAt(0) || organization.legal_name?.charAt(0) || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {organization.dba_name || organization.legal_name}
                    </h1>
                    {organization.dba_name && organization.legal_name !== organization.dba_name && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {organization.legal_name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge 
                        variant={organization.verification_status === 'approved' ? 'default' : 'secondary'}
                      >
                        {organization.verification_status === 'approved' ? 'Verified Organization' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="flex-1 space-y-4">
                  {/* Categories */}
                  {organization.categories && organization.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {organization.categories.map((category, index) => (
                        <Badge key={index} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {organization.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{organization.country}</span>
                      </div>
                    )}
                    {organization.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={organization.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Established {joinDate}</span>
                    </div>
                  </div>

                  {/* Stats and Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground">{organizationCampaigns.length}</div>
                        <div className="text-muted-foreground">Campaigns</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground">
                          {formatCurrency(totalFundsRaised)}
                        </div>
                        <div className="text-muted-foreground">Raised</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {followerCount}
                        </div>
                        <div className="text-muted-foreground">Followers</div>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <FollowOrganizationButton organizationId={organization.id} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Active Campaigns ({organizationCampaigns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
              ) : campaignsError ? (
                <ErrorMessage message={campaignsError} />
              ) : organizationCampaigns.length > 0 ? (
                <FundraiserGrid 
                  fundraisers={organizationCampaigns} 
                  donations={{}}
                  loading={false}
                  error={null}
                  onCardClick={(slug) => window.location.href = `/fundraiser/${slug}`}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active campaigns at the moment
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  );
}