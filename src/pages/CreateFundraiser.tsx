/**
 * Create Fundraiser Page
 * Redesigned with multi-step wizard and AI enhancement
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { CreateFundraiserWizard } from '@/components/fundraiser/create/CreateFundraiserWizard';

export default function CreateFundraiser() {
  return (
    <AppLayout>
      <PageContainer maxWidth="2xl" className="section-hierarchy py-8">
        <PageHeader
          title="Create New Fundraiser"
          description="Follow the steps below to launch your campaign with AI-powered assistance"
          className="text-center mb-8"
        />
        <CreateFundraiserWizard />
      </PageContainer>
    </AppLayout>
  );
}