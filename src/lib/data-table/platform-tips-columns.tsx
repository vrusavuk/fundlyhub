/**
 * Platform Tips Table Column Definitions
 * Stripe-style clean table design
 */

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MoreHorizontal } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import type { TipRecord } from '@/lib/services/platformTips.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function createPlatformTipsColumns(
  onViewDonation: (id: string) => void,
  onViewCampaign: (id: string) => void
): ColumnDef<TipRecord>[] {
  return [
    {
      accessorKey: 'tipAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const tip = row.original;
        const tipAmount = MoneyMath.format(MoneyMath.create(tip.tipAmount, 'USD'));
        const percentage = tip.tipPercentage;
        
        // Badge styling based on percentage
        let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let label = 'Tip';
        
        if (percentage > 20) {
          label = 'High';
        } else if (percentage >= 10) {
          label = 'Standard';
          badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        } else {
          label = 'Low';
          badgeClass = 'bg-muted text-muted-foreground border-border';
        }
        
        return (
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">{tipAmount}</span>
            <span className="text-muted-foreground text-xs">USD</span>
            <Badge variant="outline" className={`text-xs font-normal ${badgeClass}`}>
              {label} ({percentage.toFixed(0)}%)
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'donationAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Donation" />
      ),
      cell: ({ row }) => {
        const amount = MoneyMath.format(MoneyMath.create(row.original.donationAmount, 'USD'));
        return (
          <span className="text-muted-foreground">{amount}</span>
        );
      },
    },
    {
      accessorKey: 'campaignTitle',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => {
        const tip = row.original;
        return (
          <div className="flex items-center gap-2 max-w-[280px]">
            <span className="truncate text-foreground" title={tip.campaignTitle}>
              {tip.campaignTitle}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'donorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Donor" />
      ),
      cell: ({ row }) => {
        const tip = row.original;
        if (tip.isAnonymous) {
          return <span className="text-muted-foreground italic">Anonymous</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="text-foreground">{tip.donorName}</span>
            {tip.donorEmail && (
              <span className="text-xs text-muted-foreground">{tip.donorEmail}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'creatorName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Creator" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-foreground">{row.original.creatorName}</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDateTime(date)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tip = row.original;
        
        return (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onViewCampaign(tip.campaignId);
              }}
              title="View campaign"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDonation(tip.donationId)}>
                  View donation details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewCampaign(tip.campaignId)}>
                  View campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
