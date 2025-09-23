import { useParams, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { SmartBreadcrumb } from '@/components/navigation/SmartBreadcrumb';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { FundraiserHero } from '@/components/fundraisers/FundraiserHero';
import { FundraiserMetrics } from '@/components/fundraisers/FundraiserMetrics';
import { FundraiserSidebar } from '@/components/fundraisers/FundraiserSidebar';
import { FundraiserContent } from '@/components/fundraisers/FundraiserContent';
import { MobileDonationBar } from '@/components/fundraisers/MobileDonationBar';
import { useFundraiserDetail } from '@/hooks/useFundraiserDetail';

export default function FundraiserDetail() {
  const { slug } = useParams<{ slug: string }>();
  const {
    fundraiser,
    donations,
    comments,
    totalRaised,
    loading,
    donating,
    commenting,
    handleDonate,
    handleComment,
  } = useFundraiserDetail(slug);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!fundraiser) {
    return <Navigate to="/404" replace />;
  }

  return (
    <AppLayout>
      <PageContainer>
        {/* Smart Navigation */}
        <div className="mb-4 sm:mb-6">
          <SmartBackButton />
          <SmartBreadcrumb />
        </div>
        
        <FundraiserHero fundraiser={fundraiser} />
        
        {/* Main Content - Full Width with right padding for floating sidebar */}
        <div className="space-y-4 sm:space-y-6 mt-6 lg:pr-96">
          <FundraiserMetrics
            goalAmount={fundraiser.goal_amount}
            totalRaised={totalRaised}
            donorCount={donations.length}
            currency={fundraiser.currency}
          />
          
          <FundraiserContent
            fundraiser={fundraiser}
            comments={comments}
            donations={donations}
            onComment={handleComment}
            commenting={commenting}
          />
        </div>

        {/* Floating Sidebar - Desktop Only */}
        <FundraiserSidebar
          fundraiser={fundraiser}
          donations={donations}
          totalRaised={totalRaised}
          onDonate={handleDonate}
          donating={donating}
        />

        {/* Mobile Donation Bar */}
        <MobileDonationBar
          fundraiser={fundraiser}
          totalRaised={totalRaised}
          donorCount={donations.length}
          onDonate={handleDonate}
          donating={donating}
        />
      </PageContainer>
    </AppLayout>
  );
}