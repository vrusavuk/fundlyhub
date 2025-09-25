import { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DonationWidget } from '@/components/DonationWidget';
import { RecentDonors } from '@/components/fundraisers/RecentDonors';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CampaignPageSkeleton } from '@/components/skeletons/CampaignPageSkeleton';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import { LazyImage } from '@/components/lazy/LazyImage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Calendar, MapPin, Verified, Facebook, Twitter, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { FollowButton } from '@/components/profile/FollowButton';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { FollowOrganizationButton } from '@/components/profile/FollowOrganizationButton';

interface Fundraiser {
  id: string;
  title: string;
  slug: string;
  summary: string;
  story_html: string;
  goal_amount: number;
  currency: string;
  category: string;
  cover_image: string;
  beneficiary_name: string;
  location: string;
  status: string;
  created_at: string;
  owner_user_id: string;
  org_id: string | null;
  profiles: {
    id: string;
    name: string;
  } | null;
  organizations: {
    id: string;
    legal_name: string;
    dba_name: string;
  } | null;
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

export default function FundraiserDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [showMobileDonation, setShowMobileDonation] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const fetchFundraiserData = useCallback(async () => {
    if (!slug) return;
    
    try {
      // Fetch fundraiser details
      const { data: fundraiserData, error: fundraiserError } = await supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(id, name),
          organizations(id, legal_name, dba_name)
        `)
        .eq('slug', slug)
        .single();

      if (fundraiserError) {
        console.error('Error fetching fundraiser:', fundraiserError);
        setLoading(false);
        return;
      }

      setFundraiser(fundraiserData);

      // Fetch donations and comments in parallel
      const [donationsResponse, commentsResponse] = await Promise.all([
        supabase
          .from('donations')
          .select(`
            *,
            profiles!donations_donor_user_id_fkey(name)
          `)
          .eq('fundraiser_id', fundraiserData.id)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_author_id_fkey(name)
          `)
          .eq('fundraiser_id', fundraiserData.id)
          .order('created_at', { ascending: false })
      ]);

      if (donationsResponse.error) {
        console.error('Error fetching donations:', donationsResponse.error);
      } else {
        setDonations(donationsResponse.data || []);
        const total = donationsResponse.data?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
        setTotalRaised(total);
      }

      if (commentsResponse.error) {
        console.error('Error fetching comments:', commentsResponse.error);
      } else {
        setComments(commentsResponse.data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching fundraiser data:', error);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchFundraiserData();
  }, [fetchFundraiserData]);

  const handleDonate = async (amount: number, tipAmount: number = 0) => {
    if (!fundraiser || !user) return;
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    setDonating(true);

    try {
      const { error } = await supabase
        .from('donations')
        .insert({
          fundraiser_id: fundraiser.id,
          donor_user_id: user.id,
          amount: amount,
          currency: 'USD',
          tip_amount: tipAmount,
          payment_status: 'paid',
          payment_provider: 'stripe',
        });

      if (error) {
        toast({
          title: "Donation failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Thank you!",
          description: "Your donation has been processed successfully.",
        });
        
        // Refresh data
        await fetchFundraiserData();
        
        // Trigger events for analytics
        window.dispatchEvent(new CustomEvent('donationMade'));
        
        setTimeout(() => {
          if (window.location.pathname === '/campaigns') {
            window.location.reload();
          }
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDonating(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundraiser || !user || !newComment.trim()) return;
    
    setCommenting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          fundraiser_id: fundraiser.id,
          author_id: user.id,
          content: newComment.trim(),
        });

      if (error) {
        toast({
          title: "Comment failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully.",
        });
        setNewComment('');
        await fetchFundraiserData();
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCommenting(false);
    }
  };

  const handleShare = useCallback((platform: string) => {
    const url = `${window.location.origin}/fundraiser/${fundraiser?.slug}`;
    const text = `Help support: ${fundraiser?.title}`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(
          () => toast({ title: "Link copied!", description: "Fundraiser link copied to clipboard" }),
          () => toast({ title: "Failed to copy", variant: "destructive" })
        );
        break;
    }
  }, [fundraiser, toast]);

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <CampaignPageSkeleton />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!fundraiser) {
    return (
      <AppLayout>
        <PageContainer>
          <ErrorMessage 
            message="The fundraiser you're looking for doesn't exist or has been removed."
            onRetry={() => window.history.back()}
          />
        </PageContainer>
      </AppLayout>
    );
  }

  const progressPercentage = Math.min((totalRaised / fundraiser.goal_amount) * 100, 100);

  return (
    <AppLayout>
      <PageContainer>
        {/* Smart Navigation */}
        <div className="mb-4 sm:mb-6">
          <SmartBackButton />
          <SmartBreadcrumb />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Hero Image */}
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
              <img
                src={fundraiser.cover_image}
                alt={fundraiser.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {fundraiser.category}
                </Badge>
                {fundraiser.location && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {fundraiser.location}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDate(fundraiser.created_at)}
                </Badge>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{fundraiser.title}</h1>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{fundraiser.summary}</p>
              
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Campaign Organizer */}
                <Link 
                  to={`/profile/${fundraiser.owner_user_id}`}
                  className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors group"
                >
                  <Avatar className="h-12 w-12 transition-colors">
                    <AvatarFallback>{fundraiser.profiles?.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium transition-colors">
                        {fundraiser.profiles?.name || 'Anonymous'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <Verified className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">Organizer</span>
                  </div>
                </Link>

                {/* Follow Campaign Organizer Button */}
                {fundraiser.owner_user_id && (
                  <FollowButton 
                    userId={fundraiser.owner_user_id} 
                    size="sm"
                    variant="outline"
                  />
                )}

                {/* Organization Info & Follow Button */}
                {fundraiser.organizations && (
                  <>
                    <Link 
                      to={`/organization/${fundraiser.organizations.id}`}
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors group"
                    >
                      <Avatar className="h-10 w-10 transition-colors">
                        <AvatarFallback className="bg-muted text-foreground">
                          {fundraiser.organizations.dba_name?.charAt(0) || fundraiser.organizations.legal_name?.charAt(0) || 'O'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm transition-colors">
                            {fundraiser.organizations.dba_name || fundraiser.organizations.legal_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Organization
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">Supporting this cause</span>
                      </div>
                    </Link>
                    
                    <FollowOrganizationButton 
                      organizationId={fundraiser.organizations.id}
                      size="sm"
                      variant="outline"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Mobile donation widget */}
            <div className="lg:hidden">
              <DonationWidget
                fundraiserId={fundraiser.id}
                title={fundraiser.title}
                creatorName={fundraiser.profiles?.name || 'Anonymous'}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={totalRaised}
                donorCount={donations.length}
                progressPercentage={progressPercentage}
                currency={fundraiser.currency}
                onDonate={handleDonate}
                loading={donating}
              />
            </div>

            {/* Tabs for Story, Updates, Comments */}
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                <TabsTrigger value="story" className="text-sm">Story</TabsTrigger>
                <TabsTrigger value="updates" className="text-sm">Updates</TabsTrigger>
                <TabsTrigger value="comments" className="text-sm">Comments ({comments.length})</TabsTrigger>
              </TabsList>
                
              <TabsContent value="story" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: fundraiser.story_html }}
                    />
                  </CardContent>
                </Card>

                {/* Share Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Share this fundraiser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleShare('facebook')}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleShare('twitter')}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleShare('copy')}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Donors - Desktop only in story tab */}
                <div className="lg:hidden">
                  <RecentDonors donations={donations} />
                </div>
              </TabsContent>
              
              <TabsContent value="updates" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No updates yet.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comments" className="mt-6">
                <div className="space-y-4">
                  {/* Add Comment Form */}
                  {user && (
                    <Card>
                      <CardContent className="p-4">
                        <form onSubmit={handleComment} className="space-y-4">
                          <Textarea
                            placeholder="Leave a comment of support..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                          <Button type="submit" disabled={commenting || !newComment.trim()}>
                            {commenting ? 'Posting...' : 'Post Comment'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <Card key={comment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{comment.profiles?.name || 'Anonymous'}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {comments.length === 0 && (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-muted-foreground">No comments yet. Be the first to show your support!</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="sticky top-20 z-10">
              <DonationWidget
                fundraiserId={fundraiser.id}
                title={fundraiser.title}
                creatorName={fundraiser.profiles?.name || 'Anonymous'}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={totalRaised}
                donorCount={donations.length}
                progressPercentage={progressPercentage}
                currency={fundraiser.currency}
                onDonate={handleDonate}
                loading={donating}
                isFloating={true}
              />
            </div>

            {/* Recent Donors */}
            <RecentDonors donations={donations} />
          </div>
        </div>

        {/* Fixed Mobile Donation Button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
          {!showMobileDonation ? (
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="font-medium">{formatCurrency(totalRaised)} of {formatCurrency(fundraiser.goal_amount)}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
              <Button 
                className="w-full touch-target" 
                size="lg"
                onClick={() => setShowMobileDonation(true)}
              >
                Donate now
              </Button>
            </div>
          ) : (
            <div className="p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Make a donation</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileDonation(false)}
                >
                  ✕
                </Button>
              </div>
              <DonationWidget
                fundraiserId={fundraiser.id}
                title={fundraiser.title}
                creatorName={fundraiser.profiles?.name || 'Anonymous'}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={totalRaised}
                donorCount={donations.length}
                progressPercentage={progressPercentage}
                currency={fundraiser.currency}
                onDonate={(amount, tipAmount) => {
                  handleDonate(amount, tipAmount);
                  setShowMobileDonation(false);
                }}
                loading={donating}
              />
            </div>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}