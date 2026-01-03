/**
 * Campaign Detail Sidebar Component
 * Supports both view and edit modes
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { DetailSidebarSection } from './DetailSidebar';
import { DetailKeyValue } from './DetailKeyValue';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CampaignEditData } from '@/lib/validation/campaignEdit.schema';

interface CampaignDetailSidebarProps {
  campaign: any;
  isEditing?: boolean;
  form?: UseFormReturn<CampaignEditData>;
}

export function CampaignDetailSidebar({ campaign, isEditing = false, form }: CampaignDetailSidebarProps) {
  const statusColors = {
    active: 'default',
    pending: 'secondary',
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
        
        {isEditing && form ? (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        ) : (
          <DetailKeyValue
            label="Status"
            value={
              <Badge variant={statusColors[campaign.status as keyof typeof statusColors] || 'default'}>
                {campaign.status}
              </Badge>
            }
          />
        )}
        
        {isEditing && form ? (
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Visibility</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        ) : (
          <DetailKeyValue
            label="Visibility"
            value={campaign.visibility}
          />
        )}
        
        <DetailKeyValue
          label="Created"
          value={new Date(campaign.created_at).toLocaleDateString()}
        />
        
        {isEditing && form ? (
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">End Date</FormLabel>
                <div className="flex items-center gap-1">
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      type="date" 
                      className="h-8 flex-1"
                    />
                  </FormControl>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => field.onChange(null)}
                      title="Clear end date"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </FormItem>
            )}
          />
        ) : campaign.end_date ? (
          <DetailKeyValue
            label="End Date"
            value={new Date(campaign.end_date).toLocaleDateString()}
          />
        ) : null}
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
