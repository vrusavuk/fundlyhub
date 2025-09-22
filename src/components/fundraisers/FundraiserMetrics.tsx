import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/formatters';

interface FundraiserMetricsProps {
  goalAmount: number;
  totalRaised: number;
  donorCount: number;
  currency: string;
  className?: string;
}

export function FundraiserMetrics({ 
  goalAmount, 
  totalRaised, 
  donorCount, 
  currency,
  className 
}: FundraiserMetricsProps) {
  const progressPercentage = Math.min((totalRaised / goalAmount) * 100, 100);

  return (
    <div className={`lg:hidden space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Raised</span>
        <span className="font-medium">
          {formatCurrency(totalRaised)} of {formatCurrency(goalAmount)}
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{donorCount} donors</span>
        <span>{Math.round(progressPercentage)}% funded</span>
      </div>
    </div>
  );
}