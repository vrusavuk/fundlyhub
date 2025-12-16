/**
 * Step 0: Choose between Quick Fundraiser or Structured Project
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rocket, Target, Check, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY, WIZARD_ICONS, WIZARD_GAPS } from './designConstants';

interface Step0ProjectTypeProps {
  value: boolean | undefined;
  onChange: (isProject: boolean) => void;
  onImportClick?: () => void;
}

export function Step0ProjectType({ value, onChange, onImportClick }: Step0ProjectTypeProps) {
  return (
    <div className={WIZARD_SPACING.stepContainer}>
      <div className={`text-center ${WIZARD_SPACING.fieldGroup}`}>
        <h2 className={WIZARD_TYPOGRAPHY.stepTitle}>Choose Your Fundraising Type</h2>
        <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground max-w-2xl mx-auto`}>
          Select the format that best fits your needs
        </p>
      </div>
      
      {/* Import from GoFundMe option */}
      {onImportClick && (
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            onClick={onImportClick}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Import from GoFundMe
          </Button>
        </div>
      )}

      <div className={`grid md:grid-cols-2 ${WIZARD_GAPS.responsive} max-w-4xl mx-auto`}>
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
                <Check className={WIZARD_ICONS.standard} />
              </div>
            </div>
          )}
          
          <Badge className="absolute top-3 right-3 bg-primary/90 hover:bg-primary">
            MOST POPULAR
          </Badge>
          
          <CardHeader className="pb-3">
            <div className={`flex items-start ${WIZARD_GAPS.standard}`}>
              <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Rocket className={`${WIZARD_ICONS.hero} text-primary`} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg mb-0.5">Quick Fundraiser</CardTitle>
                <CardDescription className={WIZARD_TYPOGRAPHY.helperText}>Simple setup</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={WIZARD_SPACING.cardSubsection}>
            <div className={`flex items-center ${WIZARD_GAPS.tight} ${WIZARD_TYPOGRAPHY.helperText}`}>
              <Clock className={WIZARD_ICONS.inline} />
              <span className="font-medium">~5 minutes</span>
            </div>
            
            <ul className={`${WIZARD_SPACING.listItems} ${WIZARD_TYPOGRAPHY.bodyText}`}>
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
                <Check className={WIZARD_ICONS.standard} />
              </div>
            </div>
          )}
          
          <Badge variant="secondary" className="absolute top-3 right-3">
            ADVANCED
          </Badge>
          
          <CardHeader className="pb-3">
            <div className={`flex items-start ${WIZARD_GAPS.standard}`}>
              <div className="p-2 rounded-lg bg-accent/10 ring-1 ring-accent/20">
                <Target className={`${WIZARD_ICONS.hero} text-accent-foreground`} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg mb-0.5">Structured Project</CardTitle>
                <CardDescription className={WIZARD_TYPOGRAPHY.helperText}>With milestones</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={WIZARD_SPACING.cardSubsection}>
            <div className={`flex items-center ${WIZARD_GAPS.tight} ${WIZARD_TYPOGRAPHY.helperText}`}>
              <Clock className={WIZARD_ICONS.inline} />
              <span className="font-medium">~15 minutes</span>
            </div>
            
            <ul className={`${WIZARD_SPACING.listItems} ${WIZARD_TYPOGRAPHY.bodyText}`}>
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
        <div className={`flex items-center justify-center ${WIZARD_GAPS.inline} ${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <TrendingUp className={`${WIZARD_ICONS.standard} text-primary`} />
          <p>
            Great choice! Click <strong className="text-foreground">Next</strong> to continue with your {value ? 'Structured Project' : 'Quick Fundraiser'}
          </p>
        </div>
      )}
    </div>
  );
}
