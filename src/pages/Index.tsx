import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { EnhancedFundraiserCard } from "@/components/EnhancedFundraiserCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { TrustBadges } from "@/components/TrustBadges";
import { ArrowRight, TrendingUp, Shield, Heart, Star, Zap, CheckCircle } from "lucide-react";
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
  location?: string;
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
      console.log('Fetching fundraisers...');
      
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

      console.log('Fundraisers query result:', { fundraisersData, fundraisersError });

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
      
      {/* Hero Section with enhanced design */}
      <section className="relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="People coming together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-100 text-sm font-medium">#1 Trusted Fundraising Platform</span>
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Turn your cause into a 
                  <span className="block text-yellow-300"> successful movement</span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Join thousands of successful fundraisers. Start in minutes, reach millions of potential supporters, and make the impact that matters most.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90" 
                  asChild
                >
                  <Link to="/create">
                    Start Your Fundraiser
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 border-white text-white hover:bg-white/10" 
                  asChild
                >
                  <Link to="/">
                    How It Works
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$2.5M+</div>
                  <div className="text-sm text-white/80">Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">15K+</div>
                  <div className="text-sm text-white/80">Campaigns</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-sm text-white/80">Happy Donors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <TrustBadges />

      {/* Category filters */}
      <CategoryFilter />

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fundraisers.map((fundraiser, index) => (
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
                  donorCount={Math.floor(Math.random() * 50) + 1}
                  daysLeft={Math.floor(Math.random() * 60) + 1}
                  urgency={index % 3 === 0 ? 'high' : index % 2 === 0 ? 'medium' : 'low'}
                  isVerified={index % 4 === 0}
                  isOrganization={index % 5 === 0}
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

      {/* FundlyPay Feature Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">New Feature</span>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  FundlyPay makes generosity 
                  <span className="text-primary"> automatic</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Connect your payroll and give directly from your paycheck. Set it once, impact forever—simple, steady, and powerful.
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Automatic payroll deductions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">IRS-compliant tax receipts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-muted-foreground">Employer matching compatible</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/fundlypay">
                    Discover FundlyPay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  Learn How It Works
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-medium p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Monthly Impact</span>
                    <span className="text-2xl font-bold text-primary">$50</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Emergency Housing</span>
                      <span className="font-medium">$20</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Education Fund</span>
                      <span className="font-medium">$20</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Local Food Bank</span>
                      <span className="font-medium">$10</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span>Tax receipt generated automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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