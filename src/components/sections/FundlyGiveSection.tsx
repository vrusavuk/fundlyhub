/**
 * Fundly Give Feature Section
 * Extracted from Index page for better modularity
 */
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, CheckCircle } from "lucide-react";

export function FundlyGiveSection() {
  return (
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
  );
}