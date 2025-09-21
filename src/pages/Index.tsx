import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { FundraiserCard } from "@/components/FundraiserCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ArrowRight, TrendingUp, Shield, Heart } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import heroImage from "@/assets/hero-image.jpg";

interface Fundraiser {
  id: string;
  title: string;
  slug: string;
  summary: string;
  goal_amount: number;
  currency: string;
  category: string;
  cover_image: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

const Index = () => {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [donations, setDonations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFundraisers();
  }, []);

  const fetchFundraisers = async () => {
    try {
      // Fetch active fundraisers
      const { data: fundraisersData, error: fundraisersError } = await supabase
        .from('fundraisers')
        .select(`
          *,
          profiles!fundraisers_owner_user_id_fkey(name)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(6);

      if (fundraisersError) {
        console.error('Error fetching fundraisers:', fundraisersError);
        setLoading(false);
        return;
      }

      setFundraisers(fundraisersData || []);

      // Fetch donation totals for each fundraiser
      if (fundraisersData && fundraisersData.length > 0) {
        const fundraiserIds = fundraisersData.map(f => f.id);
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('fundraiser_id, amount')
          .in('fundraiser_id', fundraiserIds)
          .eq('payment_status', 'paid');

        if (!donationsError && donationsData) {
          const donationTotals: Record<string, number> = {};
          donationsData.forEach(donation => {
            donationTotals[donation.fundraiser_id] = 
              (donationTotals[donation.fundraiser_id] || 0) + Number(donation.amount);
          });
          setDonations(donationTotals);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Turn your cause into a 
                  <span className="bg-gradient-hero bg-clip-text text-transparent"> movement</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Create beautiful fundraising campaigns in minutes. Connect with donors who care. 
                  Make the impact that matters most to you.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/create">
                    Start Your Fundraiser
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/">
                    Browse Campaigns
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">$2.5M+</div>
                  <div className="text-sm text-muted-foreground">Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">15K+</div>
                  <div className="text-sm text-muted-foreground">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Donors</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={heroImage}
                alt="People coming together to make a difference"
                className="rounded-2xl shadow-strong"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Verified Organizations</h3>
              <p className="text-muted-foreground">All registered charities go through strict verification</p>
            </div>
            <div className="space-y-3">
              <Heart className="h-12 w-12 text-accent mx-auto" />
              <h3 className="text-lg font-semibold">Secure Donations</h3>
              <p className="text-muted-foreground">Bank-level security for all transactions</p>
            </div>
            <div className="space-y-3">
              <TrendingUp className="h-12 w-12 text-success mx-auto" />
              <h3 className="text-lg font-semibold">Real Impact</h3>
              <p className="text-muted-foreground">Track exactly how your donations make a difference</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Find causes you care about</h2>
            <p className="text-xl text-muted-foreground">Discover fundraisers across every category</p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured campaigns</h2>
            <p className="text-xl text-muted-foreground">Support these urgent causes making a difference right now</p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundraisers.map((fundraiser) => (
                <FundraiserCard
                  key={fundraiser.id}
                  id={fundraiser.id}
                  title={fundraiser.title}
                  summary={fundraiser.summary}
                  goalAmount={fundraiser.goal_amount}
                  raisedAmount={donations[fundraiser.id] || 0}
                  currency={fundraiser.currency}
                  coverImage={fundraiser.cover_image}
                  category={fundraiser.category}
                  organizationName={fundraiser.profiles?.name}
                  onClick={() => handleCardClick(fundraiser.slug)}
                />
              ))}
            </div>
          )}
          
          {!loading && fundraisers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No fundraisers available at the moment.</p>
              <Button className="mt-4" asChild>
                <Link to="/create">Be the first to create one!</Link>
              </Button>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/">
                View All Campaigns
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your fundraiser today and connect with people who want to help
          </p>
          <Button variant="accent" size="lg" className="text-lg px-8 py-6" asChild>
            <Link to="/create">
              Start Your Campaign Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-accent" />
                <span className="text-lg font-bold">FundlyHub</span>
              </div>
              <p className="text-muted-foreground">
                Connecting causes with caring people worldwide
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Fundraisers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/create" className="hover:text-primary transition-smooth">Start a Campaign</Link></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Success Stories</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Donors</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">How to Give</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Trust & Safety</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-smooth">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Press</a></li>
                <li><a href="#" className="hover:text-primary transition-smooth">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 FundlyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;