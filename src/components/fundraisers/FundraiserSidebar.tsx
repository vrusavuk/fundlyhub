import { DonationWidget } from '@/components/DonationWidget';
import { RecentDonors } from '@/components/fundraisers/RecentDonors';
import type { Fundraiser, Donation } from '@/types/fundraiser-detail';

interface FundraiserSidebarProps {
  fundraiser: Fundraiser;
  donations: Donation[];
  totalRaised: number;
  onDonate: (amount: number, tipAmount?: number) => void;
  donating: boolean;
}

export function FundraiserSidebar({
  fundraiser,
  donations,
  totalRaised,
  onDonate,
  donating,
}: FundraiserSidebarProps) {
  const progressPercentage = Math.min((totalRaised / fundraiser.goal_amount) * 100, 100);

  return (
    <div className="hidden lg:block space-y-6">
      <div className="sticky top-20">
        <DonationWidget
          fundraiserId={fundraiser.id}
          title={fundraiser.title}
          creatorName={fundraiser.profiles?.name || 'Anonymous'}
          goalAmount={fundraiser.goal_amount}
          raisedAmount={totalRaised}
          donorCount={donations.length}
          progressPercentage={progressPercentage}
          currency={fundraiser.currency}
          onDonate={onDonate}
          loading={donating}
          isFloating={true}
        />
      </div>

      <RecentDonors donations={donations} />
    </div>
  );
}