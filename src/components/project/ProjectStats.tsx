import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface ProjectStatsProps {
  totalRaised: number;
  goalAmount: number;
  totalAllocated: number;
  totalDisbursed: number;
  donorCount: number;
  currency?: string;
}

export function ProjectStats({
  totalRaised,
  goalAmount,
  totalAllocated,
  totalDisbursed,
  donorCount,
  currency = 'USD'
}: ProjectStatsProps) {
  const unallocated = totalRaised - totalAllocated;
  const allocationRate = totalRaised > 0 ? (totalAllocated / totalRaised) * 100 : 0;
  const disbursementRate = totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0;
  const progressToGoal = goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fundraising Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-baseline">
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalRaised, currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              of {formatCurrency(goalAmount, currency)} goal
            </div>
          </div>
          <Progress value={Math.min(progressToGoal, 100)} className="h-2" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{donorCount} supporters</span>
          </div>
        </CardContent>
      </Card>

      {/* Fund Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Fund Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency,
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(totalAllocated)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Allocated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency,
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(totalDisbursed)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Disbursed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency,
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(unallocated)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Available</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Allocation Rate</span>
              <span className="font-medium">{allocationRate.toFixed(1)}%</span>
            </div>
            <Progress value={allocationRate} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disbursement Rate</span>
              <span className="font-medium">{disbursementRate.toFixed(1)}%</span>
            </div>
            <Progress value={disbursementRate} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <Card className="border-success/20 bg-success/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-success/10 p-2">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">Transparent Fund Management</div>
              <div className="text-xs text-muted-foreground">
                All allocations and disbursements are tracked and visible to donors. 
                This project follows verified accountability standards.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
