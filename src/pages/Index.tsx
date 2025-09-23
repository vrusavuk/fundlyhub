import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/ui/PageContainer";
import { FundraiserGrid } from "@/components/fundraisers/FundraiserGrid";
import { CategoryFilter } from "@/components/CategoryFilter";
import { TrustBadges } from "@/components/TrustBadges";
import { ArrowRight, Star, Zap, CheckCircle, Heart } from "lucide-react";
import { useFundraisers } from "@/hooks/useFundraisers";
import heroImage from "@/assets/hero-image.jpg";
import yourCauseImage from "@/assets/categories/your-cause.jpg";
import medicalImage from "@/assets/categories/medical.jpg";
import emergencyImage from "@/assets/categories/emergency.jpg";
import educationImage from "@/assets/categories/education.jpg";
import animalImage from "@/assets/categories/animal.jpg";
import businessImage from "@/assets/categories/business.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { fundraisers, stats, loading, error, refresh } = useFundraisers({ limit: 6 });

  const handleCardClick = (slug: string) => {
    navigate(`/fundraiser/${slug}`);
  };

  return (
    <AppLayout fullWidth>
      {/* Hero Section - GoFundMe inspired design */}
      <section className="relative bg-gradient-to-br from-background via-muted/20 to-accent/5 mobile-section py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto mobile-container">
          {/* Top banner */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-semibold shadow-sm">
              <Star className="h-4 w-4 fill-current" />
              #1 crowdfunding platform
            </div>
          </div>
          
          {/* Main hero content */}
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-tight">
              Successful
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                fundraisers
              </span>
              <span className="block text-foreground">start here</span>
            </h1>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-xl text-muted-foreground leading-relaxed">
                Get started in just a few minutes — with helpful new tools, it's easier than ever to pick the perfect title, write a compelling story, and share it with the world.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-6">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                asChild
              >
                <Link to="/create">
                  Start a FundlyHub
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Floating category circles - positioned to avoid all overlaps */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="hidden lg:block relative h-full">
              {/* Left side circles - well spaced */}
              <div className="absolute top-12 left-6 animate-float" style={{animationDelay: '0s'}}>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/30 bg-white shadow-xl overflow-hidden">
                    <img src={yourCauseImage} alt="Your cause" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    Your cause
                  </div>
                </div>
              </div>
              
              <div className="absolute top-48 left-20 animate-float" style={{animationDelay: '1s'}}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-accent/30 bg-white shadow-xl overflow-hidden">
                    <img src={medicalImage} alt="Medical" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-1 py-0.5 rounded-full text-xs font-medium shadow-lg">
                    Medical
                  </div>
                </div>
              </div>
              
              <div className="absolute top-24 left-32 animate-float" style={{animationDelay: '2s'}}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-success/30 bg-white shadow-xl overflow-hidden">
                    <img src={emergencyImage} alt="Emergency" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-success text-success-foreground px-1 py-0.5 rounded-full text-xs font-medium shadow-lg">
                    Emergency
                  </div>
                </div>
              </div>
              
              {/* Right side circles - well spaced */}
              <div className="absolute top-12 right-6 animate-float" style={{animationDelay: '0.5s'}}>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-secondary/30 bg-white shadow-xl overflow-hidden">
                    <img src={educationImage} alt="Education" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                    Education
                  </div>
                </div>
              </div>
              
              <div className="absolute top-48 right-20 animate-float" style={{animationDelay: '1.5s'}}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-warning/30 bg-white shadow-xl overflow-hidden">
                    <img src={animalImage} alt="Animal" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-warning text-warning-foreground px-1 py-0.5 rounded-full text-xs font-medium shadow-lg">
                    Animal
                  </div>
                </div>
              </div>
              
              <div className="absolute top-24 right-32 animate-float" style={{animationDelay: '2.5s'}}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/30 bg-white shadow-xl overflow-hidden">
                    <img src={businessImage} alt="Business" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-1 py-0.5 rounded-full text-xs font-medium shadow-lg">
                    Business
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats section */}
          <div className="mt-32 lg:mt-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  More than $2.5 million is raised every week on FundlyHub.*
                </h2>
              </div>
              <div className="text-muted-foreground text-lg leading-relaxed">
                Get started in just a few minutes — with helpful new tools, it's easier than ever to pick the perfect title, write a compelling story, and share it with the world.
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

      {/* Fundly Give Feature Section */}
      <section className="mobile-section py-16 sm:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="max-w-7xl mx-auto mobile-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">New Feature</span>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Your Giving, Your Way—
                  <span className="text-primary"> Always Tax-Deductible</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Support verified nonprofits and charities through payroll, card, or ACH—every contribution comes with an IRS-compliant receipt. Choose how you give and change it anytime.
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-muted-foreground">Payroll, card & ACH options</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">IRS-compliant receipts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-muted-foreground">Verified nonprofits only</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/fundly-give">
                    Discover Fundly Give
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

      {/* Footer */}
      <footer className="bg-foreground/5 mobile-section py-8 sm:py-12">
        <div className="max-w-7xl mx-auto mobile-container">
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
                <li><Link to="/docs" className="hover:text-primary transition-smooth">Developers</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 FundlyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
};

export default Index;