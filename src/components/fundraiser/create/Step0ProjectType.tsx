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
    <div className="space-y-4 sm:space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold">Choose Your Fundraising Type</h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl mx-auto">
          Select the format that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
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
          
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg mb-0.5">Quick Fundraiser</CardTitle>
                <CardDescription className="text-xs">Simple setup</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-medium">~5 minutes</span>
            </div>
            
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                <span>Single goal & quick setup</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                <span>Ideal for personal causes</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
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
          
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/10 ring-1 ring-accent/20">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg mb-0.5">Structured Project</CardTitle>
                <CardDescription className="text-xs">With milestones</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-medium">~15 minutes</span>
            </div>
            
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Multiple milestones & goals</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Fund tracking & transparency</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-1 w-1 rounded-full bg-accent-foreground flex-shrink-0" />
                <span>Perfect for organizations</span>
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
