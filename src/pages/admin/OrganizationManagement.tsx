import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Target,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';

interface OrganizationData {
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

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
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

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (org.dba_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || org.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        .in('id', selectedOrgs);

      if (error) throw error;

      // Update local state
      setOrganizations(prev => 
        prev.map(org => 
          selectedOrgs.includes(org.id)
            ? { ...org, ...updateData }
            : org
        )
      );

      setSelectedOrgs([]);
      
      toast({
        title: "Bulk Action Completed",
        description: `Updated ${selectedOrgs.length} organizations`,
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

  const stats = {
    total: organizations.length,
    approved: organizations.filter(o => o.verification_status === 'approved').length,
    pending: organizations.filter(o => o.verification_status === 'pending').length,
    rejected: organizations.filter(o => o.verification_status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedOrgs.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedOrgs.length} selected
            </span>
            <Button size="sm" onClick={() => handleBulkAction('approve')}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reject')}>
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Organizations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedOrgs.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrgs(filteredOrganizations.map(o => o.id));
                    } else {
                      setSelectedOrgs([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Total Raised</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrganizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedOrgs.includes(org.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrgs(prev => [...prev, org.id]);
                      } else {
                        setSelectedOrgs(prev => prev.filter(id => id !== org.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {org.legal_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{org.legal_name}</div>
                      {org.dba_name && (
                        <div className="text-sm text-muted-foreground">
                          DBA: {org.dba_name}
                        </div>
                      )}
                      {org.website && (
                        <div className="text-xs text-muted-foreground">
                          {org.website}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(org.verification_status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {org.member_count || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Target className="w-3 h-3 mr-1" />
                    {org.campaign_count || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <DollarSign className="w-3 h-3 mr-1" />
                    ${(org.total_raised || 0).toLocaleString()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(org.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(org.id, 'approved')}
                        disabled={org.verification_status === 'approved'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(org.id, 'rejected')}
                        disabled={org.verification_status === 'rejected'}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate(org.id, 'pending')}
                        disabled={org.verification_status === 'pending'}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No organizations found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No organizations have been registered yet'
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}