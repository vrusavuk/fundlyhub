/**
 * Donation Detail Sidebar Component
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';
import type { DonationData } from '@/lib/data-table/donation-columns';

interface DonationDetailSidebarProps {
  donation: DonationData;
}

export function DonationDetailSidebar({ donation }: DonationDetailSidebarProps) {
  return (
    <>
      {/* Details Section */}
      <DetailSidebarSection title="Details">
        <DetailKeyValue
          label="Payment ID"
          value={donation.receipt_id || donation.id}
          copyable
        />
        <DetailKeyValue
          label="Payment Method"
          value={donation.payment_method || 'Card'}
        />
        <DetailKeyValue
          label="Payment Provider"
          value={donation.payment_provider || 'Stripe'}
        />
        <DetailKeyValue
          label="Currency"
          value={donation.currency}
        />
        <DetailKeyValue
          label="Last Updated"
          value={new Date(donation.created_at).toLocaleString()}
        />
      </DetailSidebarSection>

      {/* Campaign Section */}
      <DetailSidebarSection title="Campaign">
        <DetailKeyValue
          label="Campaign ID"
          value={donation.fundraiser_id}
          copyable
        />
        <DetailKeyValue
          label="Campaign Title"
          value={
            <Link
              to={`/admin/campaigns/${donation.fundraiser_id}`}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              {donation.fundraiser?.title || 'View Campaign'}
              <ExternalLink className="h-3 w-3" />
            </Link>
          }
        />
      </DetailSidebarSection>

      {/* Donor Section */}
      {donation.donor_name && (
        <DetailSidebarSection title="Donor">
          <DetailKeyValue
            label="Name"
            value={donation.donor_name}
          />
          {donation.donor_email && (
            <DetailKeyValue
              label="Email"
              value={donation.donor_email}
            />
          )}
          {donation.donor_user_id && (
            <DetailKeyValue
              label="User ID"
              value={
                <Link
                  to={`/admin/users/${donation.donor_user_id}`}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  View Profile
                  <ExternalLink className="h-3 w-3" />
                </Link>
              }
              copyable={false}
            />
          )}
          {donation.is_anonymous && (
            <Badge variant="secondary" className="mt-2">Anonymous</Badge>
          )}
        </DetailSidebarSection>
      )}
    </>
  );
}
