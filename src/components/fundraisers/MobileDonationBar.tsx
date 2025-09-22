import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DonationWidget } from '@/components/DonationWidget';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Fundraiser } from '@/types/fundraiser-detail';

interface MobileDonationBarProps {
  fundraiser: Fundraiser;
  totalRaised: number;
  donorCount: number;
  onDonate: (amount: number, tipAmount?: number) => void;
  donating: boolean;
}

export function MobileDonationBar({
  fundraiser,
  totalRaised,
  donorCount,
  onDonate,
  donating,
}: MobileDonationBarProps) {
  const [showFullWidget, setShowFullWidget] = useState(false);
  const progressPercentage = Math.min((totalRaised / fundraiser.goal_amount) * 100, 100);

  if (showFullWidget) {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="p-3 sm:p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Make a donation</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFullWidget(false)}
            >
              ✕
            </Button>
          </div>
          <DonationWidget
            fundraiserId={fundraiser.id}
            title={fundraiser.title}
            creatorName={fundraiser.profiles?.name || 'Anonymous'}
            goalAmount={fundraiser.goal_amount}
            raisedAmount={totalRaised}
            donorCount={donorCount}
            progressPercentage={progressPercentage}
            currency={fundraiser.currency}
            onDonate={(amount, tipAmount) => {
              onDonate(amount, tipAmount);
              setShowFullWidget(false);
            }}
            loading={donating}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Raised</span>
              <span className="font-medium">
                {formatCurrency(totalRaised)} of {formatCurrency(fundraiser.goal_amount)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
        <Button 
          className="w-full touch-target" 
          size="lg"
          onClick={() => setShowFullWidget(true)}
        >
          Donate now
        </Button>
      </div>
    </div>
  );
}