/**
 * Campaign Detail Sidebar Component
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';

interface CampaignDetailSidebarProps {
  campaign: any;
}

export function CampaignDetailSidebar({ campaign }: CampaignDetailSidebarProps) {
  const statusColors = {
    active: 'default',
    paused: 'secondary',
    ended: 'outline',
    closed: 'outline',
    draft: 'secondary',
  } as const;

  return (
    <>
      {/* Campaign Details */}
      <DetailSidebarSection title="Details">
        <DetailKeyValue
          label="Campaign ID"
          value={campaign.id}
          copyable
        />
        <DetailKeyValue
          label="Status"
          value={
            <Badge variant={statusColors[campaign.status as keyof typeof statusColors] || 'default'}>
              {campaign.status}
            </Badge>
          }
        />
        <DetailKeyValue
          label="Visibility"
          value={campaign.visibility}
        />
        <DetailKeyValue
          label="Category"
          value={campaign.category_name || 'Uncategorized'}
        />
        <DetailKeyValue
          label="Created"
          value={new Date(campaign.created_at).toLocaleDateString()}
        />
        {campaign.end_date && (
          <DetailKeyValue
            label="End Date"
            value={new Date(campaign.end_date).toLocaleDateString()}
          />
        )}
      </DetailSidebarSection>

      {/* Owner Information */}
      <DetailSidebarSection title="Owner">
        <DetailKeyValue
          label="Name"
          value={campaign.owner_name || 'Unknown'}
        />
        {campaign.owner_user_id && (
          <DetailKeyValue
            label="Profile"
            value={
              <Link
                to={`/admin/users/${campaign.owner_user_id}`}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                View Profile
                <ExternalLink className="h-3 w-3" />
              </Link>
            }
          />
        )}
      </DetailSidebarSection>

      {/* Quick Stats */}
      <DetailSidebarSection title="Quick Stats">
        <DetailKeyValue
          label="Donations"
          value={campaign.stats?.donor_count || 0}
        />
        <DetailKeyValue
          label="Unique Donors"
          value={campaign.stats?.unique_donors || 0}
        />
        {campaign.location && (
          <DetailKeyValue
            label="Location"
            value={campaign.location}
          />
        )}
      </DetailSidebarSection>
    </>
  );
}
