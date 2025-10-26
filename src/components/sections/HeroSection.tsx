/**
 * Hero Section Component - Main landing page hero
 * Modular component extracted from Index page for better maintainability
 */
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { FloatingCategories } from './FloatingCategories';
import { DisplayHeading, Text } from '@/components/ui/typography';

export function HeroSection() {
  return (
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
          <DisplayHeading level="2xl" as="h1" responsive className="leading-tight">
            Successful
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              fundraisers
            </span>
            <span className="block text-foreground">start here</span>
          </DisplayHeading>
          
          <div className="max-w-2xl mx-auto">
            <Text size="xl" emphasis="low" className="leading-relaxed">
              Get started in just a few minutes — with helpful new tools, it's easier than ever to pick the perfect title, write a compelling story, and share it with the world.
            </Text>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-6">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 font-semibold shadow-standard" 
              asChild
            >
              <Link to="/create">
                Start a FundlyHub
              </Link>
            </Button>
          </div>
        </div>
        
        <FloatingCategories />
        
        {/* Stats section */}
        <div className="mt-32 lg:mt-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <DisplayHeading level="md" as="h2" className="mb-4">
                More than $2.5 million is raised every week on FundlyHub.*
              </DisplayHeading>
            </div>
            <Text size="lg" emphasis="low" className="leading-relaxed">
              Get started in just a few minutes — with helpful new tools, it's easier than ever to pick the perfect title, write a compelling story, and share it with the world.
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}