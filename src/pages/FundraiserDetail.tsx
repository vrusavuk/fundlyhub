import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DonationWidget } from '@/components/DonationWidget';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Share2, Flag, Calendar, Users, MapPin, Verified, Clock, Facebook, Twitter, Copy } from 'lucide-react';

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
  profiles: {
    name: string;
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
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchFundraiser();
      fetchDonations();
      fetchComments();
    }
  }, [slug]);

  const fetchFundraiser = async () => {
    if (!slug) return;
    
    const { data, error } = await supabase
      .from('fundraisers')
      .select(`
        *,
        profiles!fundraisers_owner_user_id_fkey(name)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching fundraiser:', error);
      setLoading(false);
      return;
    }

    setFundraiser(data);
    setLoading(false);
  };

  const fetchDonations = async () => {
    if (!slug) return;
    
    const { data: fundraiserData } = await supabase
      .from('fundraisers')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!fundraiserData) return;

    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        profiles!donations_donor_user_id_fkey(name)
      `)
      .eq('fundraiser_id', fundraiserData.id)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
      return;
    }

    setDonations(data || []);
    const total = data?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
    setTotalRaised(total);
  };

  const fetchComments = async () => {
    if (!slug) return;
    
    const { data: fundraiserData } = await supabase
      .from('fundraisers')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!fundraiserData) return;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_author_id_fkey(name)
      `)
      .eq('fundraiser_id', fundraiserData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(data || []);
  };

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
          payment_status: 'paid', // In real app, this would be handled by payment processor
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
        fetchDonations(); // Refresh donations
      }
    } catch (error: any) {
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
        fetchComments(); // Refresh comments
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCommenting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!fundraiser) {
    return <Navigate to="/404" replace />;
  }

  const progressPercentage = Math.min((totalRaised / fundraiser.goal_amount) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Fundraisers</span>
              <span className="mx-2">→</span>
              <span>{fundraiser.category}</span>
              <span className="mx-2">→</span>
              <span className="text-foreground font-medium">{fundraiser.title}</span>
            </div>

            {/* Hero Image */}
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
              <img
                src={fundraiser.cover_image}
                alt={fundraiser.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
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
              
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{fundraiser.title}</h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">{fundraiser.summary}</p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{fundraiser.profiles?.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fundraiser.profiles?.name || 'Anonymous'}</span>
                      <Badge variant="outline" className="text-xs">
                        <Verified className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">Organizer</span>
                  </div>
                </div>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="story" className="mt-6 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: fundraiser.story_html }}
                    />
                  </CardContent>
                </Card>

                {/* Share Section - After Story */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Share this fundraiser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const url = `${window.location.origin}/fundraiser/${fundraiser.slug}`;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const url = `${window.location.origin}/fundraiser/${fundraiser.slug}`;
                          const text = `Help support: ${fundraiser.title}`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </Button>

                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/fundraiser/${fundraiser.slug}`);
                            toast({ title: "Link copied!", description: "Fundraiser link copied to clipboard" });
                          } catch (err) {
                            toast({ title: "Failed to copy", variant: "destructive" });
                          }
                        }}
                        className="flex items-center gap-2 hover-scale"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Donors - After Story */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Donors ({donations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donations.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground">
                        {donations.slice(0, 20).map((donation) => (
                          <div key={donation.id} className="flex-shrink-0 text-center min-w-[80px]">
                            <Avatar className="h-12 w-12 mx-auto mb-2">
                              <AvatarFallback className="text-sm font-medium">
                                {donation.profiles?.name?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium truncate">{donation.profiles?.name || 'Anonymous'}</p>
                            <p className="text-xs text-primary font-semibold">
                              {formatAmount(donation.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(donation.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No donations yet.</p>
                        <p className="text-sm text-muted-foreground">Be the first to support this cause!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
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

          {/* Sidebar - Desktop Only - Floating Donation Widget */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}