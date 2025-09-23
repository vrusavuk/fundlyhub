/**
 * Grid statistics summary component
 */
import { Card } from '@/components/ui/card';
import type { Fundraiser } from '@/types/fundraiser';

interface GridStatsProps {
  fundraisers: Fundraiser[];
  stats: Record<string, any>;
  featuredCount: number;
  trendingCount: number;
}

export function GridStats({ 
  fundraisers, 
  stats, 
  featuredCount, 
  trendingCount 
}: GridStatsProps) {
  const avgFunded = Math.round(
    fundraisers.reduce((sum, f) => {
      const fStats = stats[f.id] || {};
      return sum + ((fStats.totalRaised || 0) / f.goal_amount) * 100;
    }, 0) / fundraisers.length
  );

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">
            {fundraisers.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Active Campaigns
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-success">
            {featuredCount}
          </div>
          <div className="text-sm text-muted-foreground">
            Featured
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-accent">
            {trendingCount}
          </div>
          <div className="text-sm text-muted-foreground">
            Trending
          </div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-foreground">
            {avgFunded}%
          </div>
          <div className="text-sm text-muted-foreground">
            Avg. Funded
          </div>
        </div>
      </div>
    </Card>
  );
}