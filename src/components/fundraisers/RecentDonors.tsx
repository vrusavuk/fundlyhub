/**
 * Recent Donors section component with improved UX
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Heart } from 'lucide-react';
import { AllDonorsDialog } from './AllDonorsDialog';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  created_at: string;
  profiles: {
    name: string;
    avatar?: string;
  } | null;
}

interface RecentDonorsProps {
  donations: Donation[];
  className?: string;
}

export function RecentDonors({ donations, className }: RecentDonorsProps) {
  const [showAllDonors, setShowAllDonors] = useState(false);
  
  const donorCount = donations.length;
  const recentDonors = donations.slice(0, 5);

  if (donorCount === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            0 donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No donations yet.</p>
            <p className="text-sm text-muted-foreground">Be the first to support this cause!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {donorCount} {donorCount === 1 ? 'donor' : 'donors'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recent Donor Avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {recentDonors.map((donation, index) => (
                <Avatar 
                  key={donation.id} 
                  className="h-10 w-10 border-2 border-background relative hover:z-10 transition-transform hover:scale-110"
                  style={{ zIndex: recentDonors.length - index }}
                >
                  <AvatarImage src={donation.profiles?.avatar} />
                  <AvatarFallback className="text-sm font-medium">
                    {donation.profiles?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            
            {donorCount > 5 && (
              <div className="text-sm text-muted-foreground">
                and {donorCount - 5} more
              </div>
            )}
          </div>

          {/* View All Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAllDonors(true)}
            className="w-full"
          >
            View All Donors
          </Button>
        </CardContent>
      </Card>

      {/* All Donors Dialog */}
      <AllDonorsDialog
        isOpen={showAllDonors}
        onClose={() => setShowAllDonors(false)}
        donations={donations}
      />
    </>
  );
}