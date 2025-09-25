import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  Target,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { DataTable } from '@/components/ui/data-table';
import { createOrganizationColumns, OrganizationData } from '@/lib/data-table/organization-columns';
import { AdminStatsGrid } from '@/components/admin/AdminStatsCards';
import { EnhancedPageHeader } from '@/components/admin/EnhancedPageHeader';
import { useOptimisticUpdates, OptimisticUpdateIndicator } from '@/components/admin/OptimisticUpdates';


export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState<OrganizationData[]>([]);
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

  // Enhanced with optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => {
      fetchOrganizations(); // Refresh data after successful operations
    },
    onError: (action, error) => {
      console.error(`Action ${action.type} failed:`, error);
    }
  });

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations with basic data
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // For each organization, get member count and campaign count
      const enrichedOrgs = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from('org_members')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org.id);

          // Get campaign count and total raised
          const { data: campaigns } = await supabase
            .from('fundraisers')
            .select('id, goal_amount')
            .eq('org_id', org.id);

          const campaignCount = campaigns?.length || 0;
          const totalRaised = campaigns?.reduce((sum, c) => sum + Number(c.goal_amount || 0), 0) || 0;

          return {
            ...org,
            member_count: memberCount || 0,
            campaign_count: campaignCount,
            total_raised: totalRaised
          } as OrganizationData;
        })
      );

      setOrganizations(enrichedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Create columns for the data table
  const columns = createOrganizationColumns(
    // onViewDetails
    (org) => {
      // TODO: Implement view details dialog
      console.log('View details for:', org);
    },
    // onStatusUpdate
    (orgId, status) => {
      handleStatusUpdate(orgId, status);
    },
    // permissions
    {
      canManageOrganizations: hasPermission('manage_organizations'),
      canViewDetails: hasPermission('view_organization_details'),
    }
  );

  const handleStatusUpdate = async (orgId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    const organization = organizations.find(org => org.id === orgId);
    if (!organization) return;

    return optimisticUpdates.executeAction(
      {
        type: 'update',
        description: `Change organization "${organization.legal_name}" status to ${newStatus}`,
        originalData: { ...organization },
        rollbackFn: async () => {
          // Rollback to original status
          await supabase
            .from('organizations')
            .update({ verification_status: organization.verification_status })
            .eq('id', orgId);
        }
      },
      async () => {
        // Optimistically update local state first
        setOrganizations(prev => 
          prev.map(org => 
            org.id === orgId 
              ? { ...org, verification_status: newStatus, updated_at: new Date().toISOString() }
              : org
          )
        );

        const { error } = await supabase
          .from('organizations')
          .update({ 
            verification_status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId);

        if (error) throw error;

        // Get current user
        const { data: user } = await supabase.auth.getUser();
        
        // Log the action
        await supabase.rpc('log_audit_event', {
          _actor_id: user.user?.id,
          _action: `organization_${newStatus}`,
          _resource_type: 'organization',
          _resource_id: orgId,
          _metadata: { previous_status: organization.verification_status }
        });

        return { orgId, newStatus };
      }
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrgs.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select organizations to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    try {
      let updateData: any = {};
      const orgIds = selectedOrgs.map(org => org.id);
      
      switch (action) {
        case 'approve':
          updateData = { verification_status: 'approved' };
          break;
        case 'reject':
          updateData = { verification_status: 'rejected' };
          break;
        case 'pending':
          updateData = { verification_status: 'pending' };
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('organizations')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .in('id', orgIds);

      if (error) throw error;

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          orgIds.includes(org.id)
            ? { ...org, ...updateData }
            : org
        )
      );

      setSelectedOrgs([]);
      
      toast({
        title: "Bulk Action Completed",
        description: `Updated ${orgIds.length} organizations`,
      });
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const stats = [
    {
      title: "Total Organizations",
      value: organizations.length,
      icon: Building2,
      description: "All registered organizations"
    },
    {
      title: "Approved",
      value: organizations.filter(o => o.verification_status === 'approved').length,
      icon: CheckCircle,
      iconClassName: "text-success",
      description: "Verified organizations"
    },
    {
      title: "Pending Review",
      value: organizations.filter(o => o.verification_status === 'pending').length,
      icon: Clock,
      iconClassName: "text-warning",
      description: "Awaiting verification"
    },
    {
      title: "Rejected",
      value: organizations.filter(o => o.verification_status === 'rejected').length,
      icon: XCircle,
      iconClassName: "text-destructive",
      description: "Verification failed"
    },
  ];

  return (
    <div className="section-hierarchy">
      {/* Enhanced Page Header */}
      <EnhancedPageHeader
        title="Organization Management"
        description="Manage and verify organization accounts"
        actions={[
          {
            label: 'Refresh',
            onClick: fetchOrganizations,
            icon: RefreshCw,
            variant: 'outline',
            loading: loading
          },
          {
            label: 'Export',
            onClick: () => {
              toast({
                title: 'Export Started',
                description: 'Organization data export will begin shortly'
              });
            },
            icon: Download,
            variant: 'outline'
          }
        ]}
      />

      {/* Enhanced Stats */}
      <AdminStatsGrid stats={stats} />

      {/* Bulk Actions */}
      {selectedOrgs.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="font-medium">
                  {selectedOrgs.length} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  organizations ready for bulk action
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => handleBulkAction('approve')}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleBulkAction('reject')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedOrgs([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Organizations DataTable */}
      <DataTable
        columns={columns}
        data={organizations}
        loading={loading}
        enableSelection={true}
        enableSorting={true}
        enableFiltering={true}
        enableColumnVisibility={true}
        enablePagination={true}
        searchPlaceholder="Search organizations..."
        emptyStateTitle="No organizations found"
        emptyStateDescription="No organizations match your current search and filter criteria."
        onSelectionChange={setSelectedOrgs}
        density="comfortable"
        className="border rounded-lg"
      />

      {/* Optimistic Update Indicator */}
      <OptimisticUpdateIndicator
        state={optimisticUpdates.state}
        onRollback={optimisticUpdates.rollbackAction}
        onClearCompleted={optimisticUpdates.clearCompleted}
        onClearFailed={optimisticUpdates.clearFailed}
      />
    </div>
  );
}