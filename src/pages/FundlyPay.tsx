import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Receipt, TrendingUp, CheckCircle, Clock, DollarSign, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";

const FundlyPay = () => {
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
              <span className="font-semibold">Introducing FundlyPay</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              FundlyPay makes generosity 
              <span className="block text-yellow-300">automatic</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Connect your payroll, choose your cause, and give directly from your paycheck—simple, steady, and powerful.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
              >
                Get Started with FundlyPay
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
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Turn Paychecks into Impact
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  With FundlyPay, every payday becomes an opportunity to make a difference. By integrating with leading U.S. payroll platforms, FundlyHub lets you set up automatic contributions that flow directly from your paycheck into the funds and nonprofits you care about most.
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Effortless giving</h3>
                    <p className="text-muted-foreground">Once you set it up, your donations run on autopilot.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Built for nonprofits and personal causes</h3>
                    <p className="text-muted-foreground">Support verified charities or community fundraisers with ease.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tax-ready receipts</h3>
                    <p className="text-muted-foreground">For qualified charities, FundlyHub generates IRS-compliant donation receipts and year-end summaries.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Amplify your impact</h3>
                    <p className="text-muted-foreground">Employer gift matching works seamlessly with FundlyPay.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Transparent tracking</h3>
                    <p className="text-muted-foreground">View your giving history and progress anytime in your FundlyHub dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-2xl p-8">
                <div className="space-y-6">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Payroll Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Contribution</span>
                        <span className="font-semibold">$50.00</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4" />
                        Your Chosen Cause
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Emergency Housing Fund</div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>This month's impact</span>
                          <span className="font-semibold text-success">$200 raised</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <Card className="shadow-soft">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Tax Receipt Ready
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        IRS-compliant documentation generated automatically
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">$1.2M+</div>
              <div className="text-muted-foreground">Contributed through payroll</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent">2,500+</div>
              <div className="text-muted-foreground">Active FundlyPay users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-success">98%</div>
              <div className="text-muted-foreground">User satisfaction rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Payroll Partners Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Trusted Payroll Partners
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              FundlyPay seamlessly integrates with leading payroll providers to make giving effortless for employees across thousands of organizations.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center">
            {[
              { name: "ADP", logo: "ADP" },
              { name: "Paylocity", logo: "Paylocity" },
              { name: "Gusto", logo: "Gusto" },
              { name: "Paychex", logo: "Paychex" },
              { name: "BambooHR", logo: "BambooHR" },
              { name: "Workday", logo: "Workday" },
              { name: "UltiPro", logo: "UltiPro" },
              { name: "Paycom", logo: "Paycom" },
              { name: "QuickBooks", logo: "QuickBooks" },
              { name: "Ceridian", logo: "Ceridian" }
            ].map((partner, index) => (
              <div key={index} className="group">
                <div className="w-32 h-20 bg-card rounded-lg border shadow-soft flex items-center justify-center hover:shadow-medium transition-all duration-300 group-hover:scale-105">
                  <span className="text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                    {partner.logo}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  SOC 2 compliant integrations with bank-level encryption
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold">Quick Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your payroll in under 5 minutes with guided setup
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold">HR Approved</h3>
                <p className="text-sm text-muted-foreground">
                  Trusted by HR teams at Fortune 500 companies
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Don't see your payroll provider? We're constantly adding new partners.
            </p>
            <Button variant="outline" size="lg">
              Request Integration
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to automate your generosity?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of people making consistent impact through FundlyPay
          </p>
          <Button variant="secondary" size="lg" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90">
            Start Your FundlyPay Setup
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Compliance Note */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payroll contributions are deducted after taxes. Donations to eligible nonprofits may be tax-deductible if you itemize. FundlyHub provides IRS-compliant receipts for all qualified donations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">&copy; 2024 FundlyHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FundlyPay;