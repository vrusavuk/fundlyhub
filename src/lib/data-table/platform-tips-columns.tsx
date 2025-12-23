/**
 * Platform Tips Table Column Definitions
 */

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ExternalLink, Eye } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { formatDate } from '@/lib/utils/date';
import type { TipRecord } from '@/lib/services/platformTips.service';

export function createPlatformTipsColumns(
  onViewDonation: (id: string) => void,
  onViewCampaign: (id: string) => void
): ColumnDef<TipRecord>[] {
  return [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
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
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">
                {tip.donorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{tip.donorName}</span>
              {tip.donorEmail && !tip.isAnonymous && (
                <span className="text-xs text-muted-foreground">{tip.donorEmail}</span>
              )}
            </div>
            {tip.isAnonymous && (
              <Badge variant="secondary" className="text-xs">
                Anonymous
              </Badge>
            )}
          </div>
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
          <div className="flex items-center gap-2">
            <span className="text-sm truncate max-w-[200px]" title={tip.campaignTitle}>
              {tip.campaignTitle}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onViewCampaign(tip.campaignId)}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
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
          <span className="text-sm">{row.original.creatorName}</span>
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
        return <span className="font-medium">{amount}</span>;
      },
    },
    {
      accessorKey: 'tipAmount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tip" />
      ),
      cell: ({ row }) => {
        const amount = MoneyMath.format(MoneyMath.create(row.original.tipAmount, 'USD'));
        return <span className="font-medium text-emerald-600">{amount}</span>;
      },
    },
    {
      accessorKey: 'tipPercentage',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tip %" />
      ),
      cell: ({ row }) => {
        const percentage = row.original.tipPercentage;
        let variant: 'default' | 'secondary' | 'outline' = 'default';
        let colorClass = '';
        
        if (percentage > 20) {
          variant = 'default';
          colorClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
        } else if (percentage >= 10) {
          variant = 'secondary';
          colorClass = 'bg-blue-100 text-blue-700 hover:bg-blue-100';
        } else {
          variant = 'outline';
          colorClass = 'text-muted-foreground';
        }
        
        return (
          <Badge variant={variant} className={colorClass}>
            {percentage.toFixed(1)}%
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDonation(row.original.donationId)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        );
      },
    },
  ];
}
