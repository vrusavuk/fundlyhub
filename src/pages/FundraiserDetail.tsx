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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [donationAmount, setDonationAmount] = useState('');
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

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundraiser || !user) return;
    
    const amount = parseFloat(donationAmount);
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
        setDonationAmount('');
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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={fundraiser.cover_image}
                alt={fundraiser.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title and Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fundraiser.category}</Badge>
                {fundraiser.location && (
                  <span className="text-muted-foreground">📍 {fundraiser.location}</span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold">{fundraiser.title}</h1>
              
              <p className="text-lg text-muted-foreground">{fundraiser.summary}</p>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <span>By {fundraiser.profiles?.name || 'Anonymous'}</span>
                <span className="mx-2">•</span>
                <span>Created {formatDate(fundraiser.created_at)}</span>
              </div>
            </div>

            {/* Tabs for Story, Updates, Comments */}
            <Tabs defaultValue="story" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="story" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: fundraiser.story_html }}
                    />
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {formatAmount(totalRaised)}
                  </div>
                  <div className="text-muted-foreground">
                    raised of {formatAmount(fundraiser.goal_amount)} goal
                  </div>
                </div>
                
                <Progress value={progressPercentage} className="h-3" />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{donations.length} donations</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Make a Donation</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDonate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Donation Amount (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="25"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={donating}
                    >
                      {donating ? 'Processing...' : 'Donate Now'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Sign in to make a donation
                  </p>
                  <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                    Sign In to Donate
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex justify-between items-center">
                      <span className="font-medium">{donation.profiles?.name || 'Anonymous'}</span>
                      <span className="text-primary font-semibold">
                        {formatAmount(donation.amount)}
                      </span>
                    </div>
                  ))}
                  
                  {donations.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No donations yet. Be the first!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}