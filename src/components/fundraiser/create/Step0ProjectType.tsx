/**
 * Step 0: Choose between Quick Fundraiser or Structured Project
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Target, Check, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step0ProjectTypeProps {
  value: boolean | undefined;
  onChange: (isProject: boolean) => void;
}

export function Step0ProjectType({ value, onChange }: Step0ProjectTypeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold">Choose Your Fundraising Type</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Select the format that best fits your needs. You can always customize further in the next steps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {/* Quick Fundraiser Card */}
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2",
            value === false 
              ? "ring-2 ring-primary ring-offset-2 border-primary shadow-lg" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onChange(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(false);
            }
          }}
          aria-pressed={value === false}
        >
          {value === false && (
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}
          
          <Badge className="absolute top-3 right-3 bg-primary/90 hover:bg-primary">
            MOST POPULAR
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">Quick Fundraiser</CardTitle>
                <CardDescription className="text-sm">Simple and fast setup</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Perfect for straightforward fundraising needs. Launch quickly with a clear goal and compelling story.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">~5 minutes to complete</span>
            </div>
            
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>Single fundraising goal</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>Quick 4-step setup process</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>Ideal for personal causes & emergencies</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>Instant publishing</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Structured Project Card */}
        <Card 
          className={cn(
            "relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2",
            value === true 
              ? "ring-2 ring-accent ring-offset-2 border-accent shadow-lg" 
              : "border-border hover:border-accent/50"
          )}
          onClick={() => onChange(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(true);
            }
          }}
          aria-pressed={value === true}
        >
          {value === true && (
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-accent text-accent-foreground rounded-full p-1.5 shadow-lg">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}
          
          <Badge variant="secondary" className="absolute top-3 right-3">
            ADVANCED
          </Badge>
          
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                <Target className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-1">Structured Project</CardTitle>
                <CardDescription className="text-sm">Advanced with milestones</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ideal for complex projects requiring transparency, accountability, and milestone-based funding.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">~15 minutes to complete</span>
            </div>
            
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Multiple milestones with individual goals</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Fund allocation tracking & reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Progress updates & transparency tools</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Perfect for organizations & campaigns</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {value !== undefined && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p>
            Great choice! Click <strong className="text-foreground">Next</strong> to continue with your {value ? 'Structured Project' : 'Quick Fundraiser'}
          </p>
        </div>
      )}
    </div>
  );
}
