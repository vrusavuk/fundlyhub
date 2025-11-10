import { ColumnDef } from "@tanstack/react-table";
import { StripeBadgeExact } from "@/components/ui/stripe-badge-exact";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Users,
  Target,
  DollarSign,
} from "lucide-react";

export interface OrganizationData {
  id: string;
  legal_name: string;
  dba_name: string | null;
  ein: string | null;
  website: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  categories: string[] | null;
  country: string | null;
  member_count?: number;
  campaign_count?: number;
  total_raised?: number;
}

const statusConfig = {
  approved: { label: "Approved", variant: "success" as const, icon: CheckCircle },
  rejected: { label: "Rejected", variant: "error" as const, icon: XCircle },
  pending: { label: "Pending", variant: "warning" as const, icon: Clock },
};

export function createOrganizationColumns(
  onViewDetails: (org: OrganizationData) => void,
  onStatusUpdate: (orgId: string, status: 'approved' | 'rejected' | 'pending') => void,
  permissions: { canManageOrganizations: boolean; canViewDetails: boolean; }
): ColumnDef<OrganizationData>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "legal_name",
      header: "Organization",
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-10 w-10 border-2 border-border/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {org.legal_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-foreground text-sm truncate">
                {org.legal_name}
              </div>
              {org.dba_name && (
                <div className="text-xs text-muted-foreground truncate">
                  DBA: {org.dba_name}
                </div>
              )}
              {org.website && (
                <div className="text-xs text-muted-foreground truncate">
                  {org.website}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "verification_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.verification_status;
        const config = statusConfig[status];
        const Icon = config.icon;
        
        return (
          <StripeBadgeExact variant={config.variant}>
            <Icon className="w-3 h-3 mr-1.5" />
            {config.label}
          </StripeBadgeExact>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "member_count",
      header: "Members",
      cell: ({ row }) => {
        const count = row.original.member_count || 0;
        return (
          <StripeBadgeExact variant="neutral" className="font-medium">
            <Users className="w-3 h-3 mr-1.5" />
            {count}
          </StripeBadgeExact>
        );
      },
    },
    {
      accessorKey: "campaign_count",
      header: "Campaigns",
      cell: ({ row }) => {
        const count = row.original.campaign_count || 0;
        return (
          <StripeBadgeExact variant="neutral" className="font-medium">
            <Target className="w-3 h-3 mr-1.5" />
            {count}
          </StripeBadgeExact>
        );
      },
    },
    {
      accessorKey: "total_raised",
      header: "Total Raised",
      cell: ({ row }) => {
        const amount = row.original.total_raised || 0;
        return (
          <StripeBadgeExact variant="neutral" className="font-medium">
            <DollarSign className="w-3 h-3 mr-1.5" />
            ${amount.toLocaleString()}
          </StripeBadgeExact>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const org = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
              
              {permissions.canViewDetails && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(org);
                  }}
                  className="cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              
              {permissions.canManageOrganizations && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(org.id, 'approved');
                    }}
                    disabled={org.verification_status === 'approved'}
                    className="cursor-pointer text-success hover:text-success-foreground hover:bg-success/10"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(org.id, 'rejected');
                    }}
                    disabled={org.verification_status === 'rejected'}
                    className="cursor-pointer text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(org.id, 'pending');
                    }}
                    disabled={org.verification_status === 'pending'}
                    className="cursor-pointer"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark Pending
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}