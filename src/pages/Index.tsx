import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { CategoryFilter } from "@/components/CategoryFilter";
import { TrustBadges } from "@/components/TrustBadges";
import { ArrowRight } from "lucide-react";
import { useFundraisers } from "@/hooks/useFundraisers";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { HeroSection, FundlyGiveSection, FooterSection } from "@/components/sections";

const Index = () => {
  const navigate = useNavigate();
  const { fundraisers, stats, loading, error, refresh } = useFundraisers({ limit: 6 });

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <AppLayout fullWidth>
      <HeroSection />

      {/* Trust indicators */}
      <TrustBadges />

      {/* Category filters */}
      <CategoryFilter />

      {/* Featured Campaigns */}
      <section className="mobile-section py-16 sm:py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Fundlies</h2>
            <p className="text-xl text-muted-foreground">Support these urgent causes making a difference right now</p>
          </div>
          
          <FundraiserGrid
            fundraisers={fundraisers}
            stats={stats}
            loading={loading}
            error={error}
            onCardClick={handleCardClick}
            onRetry={refresh}
            emptyMessage="No fundraisers available at the moment."
          />
          
          {!loading && fundraisers.length === 0 && !error && (
            <div className="text-center py-12">
              <Button className="mt-4" asChild>
                <Link to="/create">Be the first to create one!</Link>
              </Button>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/campaigns">
                View All Campaigns
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <FundlyGiveSection />


      {/* CTA Section */}
      <section className="mobile-section py-16 sm:py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto mobile-container text-center">
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

      <FooterSection />
      
      {/* Floating Help Button */}
      <FloatingActionButton />
    </AppLayout>
  );
};

export default Index;