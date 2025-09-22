import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Fundraiser, Donation, Comment, FundraiserDetailData } from '@/types/fundraiser-detail';

export function useFundraiserDetail(slug: string | undefined) {
  const [data, setData] = useState<FundraiserDetailData>({
    fundraiser: null,
    donations: [],
    comments: [],
    totalRaised: 0,
    loading: true,
  });
  const [donating, setDonating] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFundraiser = useCallback(async () => {
    if (!slug) return;
    
    const { data: fundraiserData, error } = await supabase
      .from('fundraisers')
      .select(`
        *,
        profiles!fundraisers_owner_user_id_fkey(id, name),
        organizations(id, legal_name, dba_name)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching fundraiser:', error);
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    setData(prev => ({ ...prev, fundraiser: fundraiserData, loading: false }));
  }, [slug]);

  const fetchDonations = useCallback(async () => {
    if (!slug) return;
    
    const { data: fundraiserData } = await supabase
      .from('fundraisers')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!fundraiserData) return;

    const { data: donationsData, error } = await supabase
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

    const donations = donationsData || [];
    const totalRaised = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
    
    setData(prev => ({ ...prev, donations, totalRaised }));
  }, [slug]);

  const fetchComments = useCallback(async () => {
    if (!slug) return;
    
    const { data: fundraiserData } = await supabase
      .from('fundraisers')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!fundraiserData) return;

    const { data: commentsData, error } = await supabase
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

    setData(prev => ({ ...prev, comments: commentsData || [] }));
  }, [slug]);

  const handleDonate = async (amount: number, tipAmount: number = 0) => {
    if (!data.fundraiser || !user) return;
    
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
          fundraiser_id: data.fundraiser.id,
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
        
        await fetchDonations();
        window.dispatchEvent(new CustomEvent('donationMade'));
        
        setTimeout(() => {
          if (window.location.pathname === '/campaigns') {
            window.location.reload();
          }
        }, 1500);
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

  const handleComment = async (content: string) => {
    if (!data.fundraiser || !user || !content.trim()) return;
    
    setCommenting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          fundraiser_id: data.fundraiser.id,
          author_id: user.id,
          content: content.trim(),
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
        await fetchComments();
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

  useEffect(() => {
    if (slug) {
      fetchFundraiser();
      fetchDonations();
      fetchComments();
    }
  }, [slug, fetchFundraiser, fetchDonations, fetchComments]);

  return {
    ...data,
    donating,
    commenting,
    handleDonate,
    handleComment,
  };
}