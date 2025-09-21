import React, { useRef, useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Receipt, CheckCircle, CreditCard, Building2, Users, Eye, Heart } from "lucide-react";
import { Link } from "react-router-dom";

// Partner logos
import adpLogo from "@/assets/partners/adp-official-logo.png";
import paychexLogo from "@/assets/partners/paychex-logo.png";
import workdayLogo from "@/assets/partners/workday-logo.png";
import bamboohrLogo from "@/assets/partners/bamboohr-logo.png";
import gustoLogo from "@/assets/partners/gusto-official-logo.png";
import quickbooksLogo from "@/assets/partners/quickbooks-logo.png";
import paylocityLogo from "@/assets/partners/paylocity-correct-logo.png";
import ukgLogo from "@/assets/partners/ukg-official-logo.png";

const FundlyGive = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let pauseTimeout: NodeJS.Timeout;
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsPaused(true);
      setIsManualScrolling(true);
      
      // Scroll horizontally with wheel
      container.scrollLeft += e.deltaY * 2;
      
      clearTimeout(pauseTimeout);
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        setIsManualScrolling(false);
      }, 100);
      
      pauseTimeout = setTimeout(() => {
        setIsPaused(false);
      }, 3000);
    };

    const handleMouseEnter = () => {
      setIsPaused(true);
    };

    const handleMouseLeave = () => {
      clearTimeout(pauseTimeout);
      if (!isManualScrolling) {
        pauseTimeout = setTimeout(() => {
          setIsPaused(false);
        }, 1000);
      }
    };

    const handleScroll = () => {
      setIsManualScrolling(true);
      setIsPaused(true);
      
      clearTimeout(scrollTimeout);
      clearTimeout(pauseTimeout);
      
      scrollTimeout = setTimeout(() => {
        setIsManualScrolling(false);
      }, 100);
      
      pauseTimeout = setTimeout(() => {
        setIsPaused(false);
      }, 2000);
    };

    const handleTouchStart = () => {
      setIsPaused(true);
      setIsManualScrolling(true);
    };

    const handleTouchEnd = () => {
      clearTimeout(pauseTimeout);
      pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsManualScrolling(false);
      }, 2000);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(pauseTimeout);
      clearTimeout(scrollTimeout);
    };
  }, [isManualScrolling]);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Introducing Fundly Give</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              Your Giving, Your Way—
              <span className="block text-yellow-300">Always Tax-Deductible</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              With Fundly Give, you can support verified nonprofits and charities through payroll, card, or ACH—every contribution comes with an IRS-compliant receipt.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
              >
                Get Started with Fundly Give
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Description Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              The simplest, smartest way to give
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Fundly Give is the simplest, smartest way to make tax-deductible donations to the causes you care about most. Whether you prefer the convenience of payroll giving, the flexibility of a credit card, or the consistency of ACH recurring payments, FundlyHub makes sure your generosity is always documented and impactful.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Three Payment Methods */}
      <section className="py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose your preferred giving method and start making an impact today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Payroll Giving */}
            <Card className="relative group hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Payroll Giving Integration</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Connect FundlyHub with your employer's payroll system and set automatic donations right from your paycheck. Every pay cycle, your chosen amount goes straight to the nonprofit you select—effortless and consistent.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Automatic deductions</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Employer matching eligible</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Payments */}
            <Card className="relative group hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <CreditCard className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Card Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Make quick one-time or recurring donations using your debit or credit card. Perfect for spontaneous giving or topping up your monthly impact.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Instant donations</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Flexible scheduling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ACH Recurring */}
            <Card className="relative group hover:shadow-lg transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-xl">ACH Recurring Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Link your bank account to set up steady, low-fee recurring donations. Ideal for sustained support of your favorite causes.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Low processing fees</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Consistent support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Fundly Give Stands Out */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Why Fundly Give Stands Out</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Always tax-deductible</h3>
                <p className="text-muted-foreground">Every donation to a qualified nonprofit through Fundly Give generates an IRS-compliant receipt, plus an annual giving summary for your records.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Flexibility built in</h3>
                <p className="text-muted-foreground">Choose how you give—payroll, card, or ACH—and change it anytime.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Verified impact</h3>
                <p className="text-muted-foreground">All nonprofits are verified for eligibility, so you can give with confidence.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Transparency</h3>
                <p className="text-muted-foreground">Track every dollar donated through your FundlyHub dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Process Flow */}
      <section className="py-20 bg-secondary/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Simple 3-Step Process</h2>
            <p className="text-xl text-muted-foreground">From setup to impact in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Method</h3>
                <p className="text-muted-foreground">Select payroll, card, or ACH based on your preference</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Pick Your Cause</h3>
                <p className="text-muted-foreground">Browse verified nonprofits and campaigns</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Giving</h3>
                <p className="text-muted-foreground">Set your amount and schedule—we handle the rest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payroll Integration Partners */}
      <section className="py-16 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Trusted Payroll Partners</h2>
            <p className="text-xl text-muted-foreground">
              Seamlessly integrated with leading payroll providers
            </p>
          </div>
          
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className={`flex gap-8 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2 ${!isPaused ? 'animate-scroll' : ''}`}
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth'
              }}
            >
              {/* Partner logos with names */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={adpLogo} alt="ADP" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">ADP</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={paychexLogo} alt="Paychex" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">Paychex</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={workdayLogo} alt="Workday" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">Workday</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={bamboohrLogo} alt="BambooHR" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">BambooHR</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={paylocityLogo} alt="Paylocity" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">Paylocity</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={ukgLogo} alt="UKG" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">UKG</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={gustoLogo} alt="Gusto" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">Gusto</span>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-3 bg-background p-6 rounded-xl border shadow-sm min-w-[180px]">
                <img src={quickbooksLogo} alt="QuickBooks" className="h-12 w-auto object-contain" />
                <span className="font-semibold text-foreground">QuickBooks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">$2.8M+</div>
              <div className="text-muted-foreground">Total donations processed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent">5,200+</div>
              <div className="text-muted-foreground">Active Fundly Give users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">850+</div>
              <div className="text-muted-foreground">Verified nonprofit partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to make giving effortless?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of people making consistent impact through Fundly Give
          </p>
          <Button variant="secondary" size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90">
            Start Your Fundly Give Setup
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          {/* Compliance Note */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-white/70 max-w-4xl mx-auto leading-relaxed">
              <strong>Compliance Note:</strong> Donations through Fundly Give are only tax-deductible when made to qualified §170(c) nonprofit organizations. Payroll deductions are taken after taxes but remain eligible as charitable contributions if you itemize. FundlyHub provides IRS-compliant receipts and annual summaries for all qualified donations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FundlyGive;