/**
 * Create Fundraiser Page
 * Redesigned with multi-step wizard and AI enhancement
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { CreateFundraiserWizard } from '@/components/fundraiser/create/CreateFundraiserWizard';
import { ProtectedFeatureRoute } from '@/components/common/ProtectedFeatureRoute';

export default function CreateFundraiser() {
  return (
    <AppLayout>
      <ProtectedFeatureRoute featureKey="features.fundraiser_creation">
        <PageContainer maxWidth="2xl" className="py-3 sm:py-4 md:py-6">
          <PageHeader
            title="Create New Fundraiser"
            description="Follow the steps below to launch your campaign with AI-powered assistance"
            className="mb-4 sm:mb-5"
            showBackButton={false}
          />
          <CreateFundraiserWizard />
        </PageContainer>
      </ProtectedFeatureRoute>
    </AppLayout>
  );
}