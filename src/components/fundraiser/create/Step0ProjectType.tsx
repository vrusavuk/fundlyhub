/**
 * Step 0: Choose between Quick Fundraiser or Structured Project
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Target } from 'lucide-react';

interface Step0ProjectTypeProps {
  value: boolean;
  onChange: (isProject: boolean) => void;
  onNext: () => void;
}

export function Step0ProjectType({ value, onChange, onNext }: Step0ProjectTypeProps) {
  const handleSelect = (isProject: boolean) => {
    onChange(isProject);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Your Fundraising Type</h2>
        <p className="text-muted-foreground">
          Select the format that best fits your needs
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            value === false ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleSelect(false)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Quick Fundraiser</CardTitle>
                <CardDescription>Simple and fast</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Perfect for straightforward fundraising needs. Get started quickly with a simple goal and story.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Single fundraising goal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Quick setup (3 steps)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Great for personal causes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            value === true ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleSelect(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent">
                <Target className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Structured Project</CardTitle>
                <CardDescription>Advanced with milestones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ideal for complex projects requiring transparency and milestone tracking.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-accent-foreground">•</span>
                <span>Multiple milestones with goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-foreground">•</span>
                <span>Fund allocation tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-foreground">•</span>
                <span>Progress updates and transparency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-foreground">•</span>
                <span>Perfect for organizations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="lg" onClick={() => handleSelect(false)}>
          Continue with {value ? 'Structured Project' : 'Quick Fundraiser'}
        </Button>
      </div>
    </div>
  );
}
