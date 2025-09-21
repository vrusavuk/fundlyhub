import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { EnhancedFundraiserCard } from "@/components/EnhancedFundraiserCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

interface Fundraiser {
  id: string;
  title: string;
  slug: string;
  summary: string;
  goal_amount: number;
  currency: string;
  cover_image: string;
  category: string;
  location?: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

export default function AllCampaigns() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [donations, setDonations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 24;
  const navigate = useNavigate();

  const fetchFundraisers = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching all fundraisers...');
      
      // Fetch fundraisers with owner names - implement pagination
      const startRange = currentPage * ITEMS_PER_PAGE;
      const endRange = startRange + ITEMS_PER_PAGE - 1;
      
      const { data: fundraisersData, error: fundraisersError } = await supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      console.log('Fundraisers query result:', { 
        fundraisersData, 
        fundraisersError,
        count: fundraisersData?.length,
        page: currentPage,
        range: `${startRange}-${endRange}`
      });

      if (fundraisersError) {
        console.error('Error fetching fundraisers:', fundraisersError);
        return;
      }

      // Append new fundraisers to existing ones for pagination
      if (currentPage === 0) {
        setFundraisers(fundraisersData || []);
      } else {
        setFundraisers(prev => [...prev, ...(fundraisersData || [])]);
      }
      
      // Check if there are more items to load
      setHasMore((fundraisersData?.length || 0) === ITEMS_PER_PAGE);

      // Fetch donation totals for all fundraisers
      const fundraiserIds = (fundraisersData || []).map(f => f.id);
      if (fundraiserIds.length > 0) {
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('fundraiser_id, amount')
          .in('fundraiser_id', fundraiserIds)
          .eq('payment_status', 'paid');

        if (!donationsError && donationsData) {
          const donationTotals = donationsData.reduce((acc, donation) => {
            acc[donation.fundraiser_id] = (acc[donation.fundraiser_id] || 0) + Number(donation.amount);
            return acc;
          }, {} as Record<string, number>);
          setDonations(donationTotals);
        }
      }
    } catch (error) {
      console.error('Error fetching fundraisers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    setFundraisers([]);
    fetchFundraisers();
  }, []);

  const loadMoreFundraisers = async () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      const startRange = nextPage * ITEMS_PER_PAGE;
      const endRange = startRange + ITEMS_PER_PAGE - 1;
      
      const { data: fundraisersData, error: fundraisersError } = await supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (!fundraisersError && fundraisersData) {
        setFundraisers(prev => [...prev, ...fundraisersData]);
        setHasMore(fundraisersData.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading more fundraisers:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  const filteredFundraisers = fundraisers.filter((fundraiser) => {
    const matchesSearch = fundraiser.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fundraiser.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fundraiser.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || fundraiser.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  console.log('Filtering debug:', {
    totalFundraisers: fundraisers.length,
    searchTerm,
    selectedCategory,
    filteredCount: filteredFundraisers.length,
    firstFewFiltered: filteredFundraisers.slice(0, 3).map(f => ({ title: f.title, category: f.category }))
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">All Campaigns</h1>
          <p className="text-lg text-muted-foreground">
            Discover and support amazing causes from around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="md:w-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {["All", "Medical", "Education", "Community", "Emergency", "Animal", "Environment", "Sports", "Arts"].map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer transition-smooth hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredFundraisers.length} campaign{filteredFundraisers.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredFundraisers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFundraisers.map((fundraiser) => (
              <EnhancedFundraiserCard
                key={fundraiser.id}
                id={fundraiser.id}
                title={fundraiser.title}
                summary={fundraiser.summary || ""}
                goalAmount={fundraiser.goal_amount}
                raisedAmount={donations[fundraiser.id] || 0}
                currency={fundraiser.currency}
                coverImage={fundraiser.cover_image || "/placeholder.svg"}
                category={fundraiser.category || "General"}
                organizationName={fundraiser.profiles?.name || "Anonymous"}
                location={fundraiser.location || undefined}
                donorCount={Math.floor(Math.random() * 100) + 1}
                daysLeft={Math.floor(Math.random() * 30) + 1}
                urgency={Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'}
                isVerified={Math.random() > 0.7}
                isOrganization={Math.random() > 0.8}
                onClick={() => handleCardClick(fundraiser.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "All" 
                ? "Try adjusting your search or filters"
                : "No campaigns are currently available"
              }
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredFundraisers.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <Button 
              onClick={loadMoreFundraisers} 
              disabled={loadingMore}
              variant="outline"
              size="lg"
            >
              {loadingMore ? "Loading..." : "Load More Campaigns"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}