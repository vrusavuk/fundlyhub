import { ColumnDef } from "@tanstack/react-table";
import { Eye, Mail, ExternalLink, RefreshCw, Copy, MoreHorizontal } from "lucide-react";

import { StripeBadgeExact } from "@/components/ui/stripe-badge-exact";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { MoneyMath } from "@/lib/enterprise/utils/MoneyMath";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createSelectionColumn,
} from "./columns";
import { formatDistanceToNow } from "date-fns";

// Donation data interface
export interface DonationData {
  id: string;
  fundraiser_id: string;
  donor_user_id?: string;
  amount: number;
  tip_amount?: number;
  fee_amount?: number;
  net_amount?: number;
  currency: string;
  payment_provider?: string;
  payment_status: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded';
  receipt_id?: string;
  message?: string;
  is_anonymous: boolean;
  donor_name?: string;
  donor_email?: string;
  payment_method?: string;
  created_at: string;
  
  // Relationships
  fundraiser?: {
    title: string;
    slug: string;
    status: string;
  };
  donor?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

// Payment status configuration with exact Stripe colors
const statusConfig = {
  pending: { label: "Pending", variant: "warning" as const },     // Stripe amber #FFC043
  paid: { label: "Paid", variant: "success" as const },           // Stripe green #00D924
  completed: { label: "Completed", variant: "success" as const }, // Stripe green #00D924
  failed: { label: "Failed", variant: "error" as const },         // Stripe red #DF1B41
  refunded: { label: "Refunded", variant: "neutral" as const },   // Stripe gray #E3E8EE
};

const getInitials = (name?: string): string => {
  if (!name) return "AN";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Create donation columns
export function createDonationColumns(
  onViewDetails: (donation: DonationData) => void,
  onViewCampaign: (fundraiserId: string) => void,
  onRefund: (donationId: string) => void,
  permissions: {
    canRefund: boolean;
    isSuperAdmin: boolean;
  }
): ColumnDef<DonationData>[] {
  return [
    // Donor column with avatar
    {
      accessorKey: "donor_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Donor" />
      ),
      cell: ({ row }) => {
        const donation = row.original;
        const isAnonymous = donation.is_anonymous;
        const donorName = isAnonymous 
          ? "Anonymous" 
          : donation.donor_name || donation.donor?.name || "Unknown";
        const donorEmail = isAnonymous 
          ? "" 
          : donation.donor_email || donation.donor?.email || "";
        const avatar = isAnonymous ? undefined : donation.donor?.avatar;

        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar} alt={donorName} />
              <AvatarFallback className="text-xs">
                {getInitials(donorName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">{donorName}</div>
              {donorEmail && (
                <div className="text-xs text-muted-foreground truncate">
                  {donorEmail}
                </div>
              )}
            </div>
          </div>
        );
      },
    },

    // Amount column with tip badge
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const donation = row.original;
        const hasTip = donation.tip_amount && donation.tip_amount > 0;

        return (
          <div className="space-y-1">
            <div className="font-semibold">
              {MoneyMath.format(MoneyMath.create(donation.amount, donation.currency))}
            </div>
            {hasTip && (
              <StripeBadgeExact variant="neutral" className="text-xs">
                +{MoneyMath.format(MoneyMath.create(donation.tip_amount!, donation.currency))} tip
              </StripeBadgeExact>
            )}
          </div>
        );
      },
    },

    // Campaign column
    {
      accessorKey: "fundraiser.title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => {
        const donation = row.original;
        return (
          <div className="min-w-[150px]">
            <button
              onClick={() => onViewCampaign(donation.fundraiser_id)}
              className="text-sm font-medium text-primary hover:underline truncate block max-w-[200px]"
            >
              {donation.fundraiser?.title || "Unknown Campaign"}
            </button>
          </div>
        );
      },
    },

    // Payment status
    {
      accessorKey: "payment_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.payment_status;
        const config = statusConfig[status] || statusConfig.pending;
        
        return (
          <StripeBadgeExact variant={config.variant}>
            {config.label}
          </StripeBadgeExact>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    // Payment provider
    {
      accessorKey: "payment_provider",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      cell: ({ row }) => {
        const provider = row.original.payment_provider || "stripe";
        
        return (
          <div className="flex items-center space-x-2">
            <div className="text-sm capitalize">{provider}</div>
          </div>
        );
      },
    },

    // Receipt ID
    {
      accessorKey: "receipt_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Receipt ID" />
      ),
      cell: ({ row }) => {
        const receiptId = row.original.receipt_id;
        
        if (!receiptId) return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex items-center space-x-1">
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {receiptId.slice(0, 12)}...
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(receiptId);
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        );
      },
    },

    // Date column
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      },
    },

    // Actions column
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const donation = row.original;
        const actions: Array<{
          label: string;
          icon: typeof Eye;
          onClick: () => void;
          variant?: "destructive";
        }> = [
          {
            label: "View Details",
            icon: Eye,
            onClick: () => onViewDetails(donation),
          },
          {
            label: "View Campaign",
            icon: ExternalLink,
            onClick: () => onViewCampaign(donation.fundraiser_id),
          },
        ];

        // Add refund action for super admins
        if (
          permissions.isSuperAdmin &&
          permissions.canRefund &&
          (donation.payment_status === 'paid' || donation.payment_status === 'completed')
        ) {
          actions.push({
            label: "Refund in Stripe",
            icon: ExternalLink,
            onClick: () => onRefund(donation.id),
          });
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick()}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];
}
