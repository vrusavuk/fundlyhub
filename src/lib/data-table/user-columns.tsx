import { ColumnDef } from "@tanstack/react-table";
import { Eye, UserX, UserCheck, Shield, Trash2, Edit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  createSelectionColumn,
  createDateColumn,
  createActionsColumn,
  createCurrencyColumn,
} from "./columns";

// User data interface
export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  failed_login_attempts: number;
  campaign_count: number;
  total_funds_raised: number;
  follower_count: number;
}

// Status configuration
const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
  suspended: { label: "Suspended", variant: "destructive" as const },
  banned: { label: "Banned", variant: "destructive" as const },
};

// Role configuration
const roleConfig = {
  super_admin: { label: "Super Admin", variant: "destructive" as const },
  platform_admin: { label: "Platform Admin", variant: "destructive" as const },
  moderator: { label: "Moderator", variant: "default" as const },
  creator: { label: "Creator", variant: "secondary" as const },
  visitor: { label: "Visitor", variant: "outline" as const },
};

// Create user columns
export function createUserColumns(
  onViewDetails: (user: UserData) => void,
  onSuspendUser: (userId: string, reason: string, duration: number) => void,
  onUnsuspendUser: (userId: string) => void,
  permissions: {
    canManageUsers: boolean;
    canViewDetails: boolean;
    isSuperAdmin: boolean;
  }
): ColumnDef<UserData>[] {
  return [
    // Selection column
    createSelectionColumn<UserData>(),

    // User column with avatar, name, and email
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-10 w-10 shadow-soft">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{user.name || 'Unnamed User'}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
      size: 250,
    },

    // Role column
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        const config = roleConfig[role as keyof typeof roleConfig];
        
        if (!config) {
          return <Badge variant="outline">{role.replace('_', ' ')}</Badge>;
        }

        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 120,
    },

    // Status column
    {
      accessorKey: "account_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("account_status") as string;
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

    // Campaigns column
    {
      accessorKey: "campaign_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaigns" />
      ),
      cell: ({ row }) => {
        const count = row.getValue("campaign_count") as number;
        return (
          <div className="text-center">
            <span className="font-medium">{count}</span>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 100,
    },

    // Total Raised column
    createCurrencyColumn<UserData>(
      "total_funds_raised",
      "Total Raised",
      "USD",
      { showFullAmount: false }
    ),

    // Last Login column
    {
      accessorKey: "last_login_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => {
        const lastLogin = row.getValue("last_login_at") as string | null;
        if (!lastLogin) {
          return <span className="text-muted-foreground">Never</span>;
        }
        
        const date = new Date(lastLogin);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">
              {diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`}
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      size: 130,
    },

    // Actions column
    createActionsColumn<UserData>(
      [
        {
          label: "View Details",
          icon: Eye,
          onClick: onViewDetails,
          hidden: () => !permissions.canViewDetails,
        },
        {
          label: "Edit User",
          icon: Edit,
          onClick: (user) => console.log("Edit user", user.id),
          hidden: () => !permissions.canManageUsers,
        },
        {
          label: "Suspend User",
          icon: UserX,
          onClick: (user) => onSuspendUser(user.id, "Administrative action", 7),
          variant: "destructive" as const,
          hidden: (user) => !permissions.canManageUsers || user.account_status === 'suspended',
        },
        {
          label: "Unsuspend User",
          icon: UserCheck,
          onClick: (user) => onUnsuspendUser(user.id),
          hidden: (user) => !permissions.canManageUsers || user.account_status !== 'suspended',
        },
        {
          label: "Promote to Admin",
          icon: Shield,
          onClick: (user) => console.log("Promote user", user.id),
          hidden: (user) => !permissions.isSuperAdmin || user.role.includes('admin'),
        },
        {
          label: "Delete User",
          icon: Trash2,
          onClick: (user) => console.log("Delete user", user.id),
          variant: "destructive" as const,
          hidden: () => !permissions.isSuperAdmin,
        },
      ]
    ),
  ];
}