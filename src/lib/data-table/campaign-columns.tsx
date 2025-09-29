import { ColumnDef } from "@tanstack/react-table";
import { Eye, CheckCircle, XCircle, Flag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  createSelectionColumn,
  createDateColumn,
  createActionsColumn,
} from "./columns";

// Campaign data interface
export interface CampaignData {
  id: string;
  title: string;
  summary?: string;
  cover_image?: string;
  category?: string;
  location?: string;
  goal_amount: number;
  currency: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'ended' | 'closed';
  created_at: string;
  owner_profile?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  stats?: {
    total_raised?: number;
    donor_count?: number;
  };
}

// Status configuration
const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  pending: { label: "Pending", variant: "outline" as const },
  active: { label: "Active", variant: "default" as const },
  paused: { label: "Paused", variant: "secondary" as const },
  ended: { label: "Ended", variant: "outline" as const },
  closed: { label: "Closed", variant: "destructive" as const },
};

// Utility functions
const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);
};

const getProgressPercentage = (raised: number, goal: number) => {
  return Math.min((raised / goal) * 100, 100);
};

const truncateText = (text: string, maxLength: number = 60): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Create campaign columns
export function createCampaignColumns(
  onViewDetails: (campaign: CampaignData) => void,
  onStatusChange: (campaignId: string, status: string) => void,
  permissions: {
    canModerate: boolean;
    isSuperAdmin: boolean;
  }
): ColumnDef<CampaignData>[] {
  return [
    // Selection column
    createSelectionColumn<CampaignData>(),

    // Campaign column with image, title, and details
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {campaign.cover_image ? (
                <img 
                  src={campaign.cover_image} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-6 w-6 text-muted-foreground">📋</div>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{campaign.title}</div>
              {campaign.summary && (
                <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {truncateText(campaign.summary, 60)}
                </div>
              )}
              <div className="flex items-center space-x-2 mt-1">
                {campaign.category && (
                  <Badge variant="outline" className="text-xs">
                    {campaign.category}
                  </Badge>
                )}
                {campaign.location && (
                  <span className="text-xs text-muted-foreground">
                    📍 {campaign.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
      size: 250,
    },

    // Owner column
    {
      accessorKey: "owner_profile",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner" />
      ),
      cell: ({ row }) => {
        const owner = row.original.owner_profile;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={owner?.avatar} />
              <AvatarFallback className="text-xs">
                {owner?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">
                {owner?.name || 'Unknown'}
              </div>
              {owner?.email && (
                <div className="text-xs text-muted-foreground">
                  {owner.email}
                </div>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      size: 200,
    },

    // Status column
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const config = statusConfig[status as keyof typeof statusConfig];
        
        if (!config) {
          return <Badge variant="outline">{status}</Badge>;
        }

        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 100,
    },

    // Progress column
    {
      accessorKey: "goal_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const campaign = row.original;
        const raised = campaign.stats?.total_raised || 0;
        const goal = campaign.goal_amount;
        const percentage = getProgressPercentage(raised, goal);

        return (
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatCurrency(raised, campaign.currency)}
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(goal, campaign.currency)}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{campaign.stats?.donor_count || 0} donors</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 200,
    },

    // Created date column
    createDateColumn<CampaignData>(
      "created_at",
      "Created",
      "MMM dd, yyyy",
      { showTime: true }
    ),

    // Actions column
    createActionsColumn<CampaignData>(
      [
        {
          label: "View Details",
          icon: Eye,
          onClick: onViewDetails,
        },
        ...(permissions.canModerate ? [
          {
            label: "Approve",
            icon: CheckCircle,
            onClick: (campaign: CampaignData) => onStatusChange(campaign.id, 'active'),
            hidden: (campaign: CampaignData) => campaign.status !== 'pending',
          },
          {
            label: "Pause",
            icon: XCircle,
            onClick: (campaign: CampaignData) => onStatusChange(campaign.id, 'paused'),
            hidden: (campaign: CampaignData) => campaign.status !== 'active',
          },
          {
            label: "Reactivate",
            icon: CheckCircle,
            onClick: (campaign: CampaignData) => onStatusChange(campaign.id, 'active'),
            hidden: (campaign: CampaignData) => !['paused', 'ended'].includes(campaign.status),
          },
          {
            label: "Close Campaign",
            icon: Flag,
            onClick: (campaign: CampaignData) => onStatusChange(campaign.id, 'closed'),
          },
        ] : []),
        ...(permissions.isSuperAdmin ? [
          {
            label: "Delete Campaign",
            icon: Trash2,
            onClick: (campaign: CampaignData) => console.log("Delete", campaign.id),
            variant: "destructive" as const,
          },
        ] : []),
      ]
    ),
  ];
}