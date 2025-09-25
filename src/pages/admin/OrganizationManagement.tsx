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


export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState<OrganizationData[]>([]);
  const { toast } = useToast();
  const { hasPermission } = useRBAC();

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
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId);

      if (error) throw error;

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === orgId 
            ? { ...org, verification_status: newStatus }
            : org
        )
      );

      toast({
        title: "Status Updated",
        description: `Organization status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive"
      });
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage and verify organization accounts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchOrganizations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Organizations DataTable */}
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
        className="bg-card rounded-lg shadow-sm"
      />
    </div>
  );
}