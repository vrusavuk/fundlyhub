/**
 * Organization Detail Sidebar Component
 */
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';

interface OrganizationDetailSidebarProps {
  organization: any;
}

export function OrganizationDetailSidebar({ organization }: OrganizationDetailSidebarProps) {
  const verificationColors = {
    verified: 'default',
    pending: 'secondary',
    rejected: 'destructive',
    unverified: 'outline',
  } as const;

  return (
    <>
      {/* Organization Details */}
      <DetailSidebarSection title="Details">
        <DetailKeyValue
          label="Organization ID"
          value={organization.id}
          copyable
        />
        <DetailKeyValue
          label="Verification Status"
          value={
            <Badge variant={verificationColors[organization.verification_status as keyof typeof verificationColors] || 'outline'}>
              {organization.verification_status}
            </Badge>
          }
        />
        <DetailKeyValue
          label="Legal Name"
          value={organization.legal_name}
        />
        {organization.dba_name && (
          <DetailKeyValue
            label="DBA Name"
            value={organization.dba_name}
          />
        )}
        {organization.ein && (
          <DetailKeyValue
            label="EIN"
            value={organization.ein}
            copyable
          />
        )}
      </DetailSidebarSection>

      {/* Contact Information */}
      <DetailSidebarSection title="Contact">
        {organization.country && (
          <DetailKeyValue
            label="Country"
            value={organization.country}
          />
        )}
        {organization.website && (
          <DetailKeyValue
            label="Website"
            value={
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Visit Website
                <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
        )}
      </DetailSidebarSection>

      {/* Metadata */}
      <DetailSidebarSection title="Metadata">
        <DetailKeyValue
          label="Created"
          value={new Date(organization.created_at).toLocaleDateString()}
        />
        <DetailKeyValue
          label="Last Updated"
          value={new Date(organization.updated_at).toLocaleDateString()}
        />
        {organization.categories && organization.categories.length > 0 && (
          <DetailKeyValue
            label="Categories"
            value={organization.categories.join(', ')}
          />
        )}
      </DetailSidebarSection>
    </>
  );
}
