import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  Users,
  CheckCircle,
  XCircle,
  Shield,
  Mail,
  UserX,
  UserCheck,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface BulkOperation {
  type: 'suspend' | 'unsuspend' | 'change_role' | 'send_message' | 'delete' | 'verify' | 'ban';
  reason?: string;
  newRole?: string;
  message?: string;
  duration?: number;
}

interface BulkUserOperationsProps {
  selectedUsers: Set<string>;
  userCount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export function BulkUserOperations({ 
  selectedUsers, 
  userCount, 
  onComplete, 
  onCancel 
}: BulkUserOperationsProps) {
  const { toast } = useToast();
  const { hasPermission, isSuperAdmin } = useRBAC();
  const [operation, setOperation] = useState<BulkOperation>({ type: 'suspend' });
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const operationLabels = {
    suspend: 'Suspend Users',
    unsuspend: 'Unsuspend Users',
    change_role: 'Change User Roles',
    send_message: 'Send Message',
    delete: 'Delete Users',
    verify: 'Verify Users',
    ban: 'Ban Users'
  };

  const operationDescriptions = {
    suspend: 'Temporarily suspend selected users from the platform',
    unsuspend: 'Restore access for suspended users',
    change_role: 'Update the role for all selected users',
    send_message: 'Send a system message to selected users',
    delete: 'Permanently delete user accounts (irreversible)',
    verify: 'Mark selected users as verified',
    ban: 'Permanently ban users from the platform'
  };

  const executeBulkOperation = async () => {
    if (selectedUsers.size === 0) return;

    try {
      setProcessing(true);
      setProgress(0);
      
      const userIds = Array.from(selectedUsers);
      const totalUsers = userIds.length;
      let processedUsers = 0;

      const { data: currentUser } = await supabase.auth.getUser();

      for (const userId of userIds) {
        setCurrentStep(`Processing user ${processedUsers + 1} of ${totalUsers}`);
        
        switch (operation.type) {
          case 'suspend':
            await suspendUser(userId, operation.reason, operation.duration);
            break;
          case 'unsuspend':
            await unsuspendUser(userId);
            break;
          case 'change_role':
            if (operation.newRole) {
              await changeUserRole(userId, operation.newRole);
            }
            break;
          case 'send_message':
            if (operation.message) {
              await sendUserMessage(userId, operation.message);
            }
            break;
          case 'delete':
            await deleteUser(userId, operation.reason);
            break;
          case 'verify':
            await verifyUser(userId);
            break;
          case 'ban':
            await banUser(userId, operation.reason);
            break;
        }

        // Log the bulk action
        await supabase.rpc('log_audit_event', {
          _actor_id: currentUser.user?.id,
          _action: `bulk_${operation.type}`,
          _resource_type: 'user',
          _resource_id: userId,
          _metadata: { 
            operation_type: operation.type,
            reason: operation.reason || 'Bulk operation',
            total_affected: totalUsers
          }
        });

        processedUsers++;
        setProgress((processedUsers / totalUsers) * 100);
      }

      toast({
        title: 'Bulk Operation Complete',
        description: `Successfully processed ${totalUsers} users`
      });

      onComplete();
    } catch (error) {
      console.error('Error executing bulk operation:', error);
      toast({
        title: 'Bulk Operation Failed',
        description: 'Some operations may have failed. Check the audit logs for details.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const suspendUser = async (userId: string, reason?: string, duration?: number) => {
    const suspendedUntil = duration ? 
      new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : 
      null;

    await supabase
      .from('profiles')
      .update({
        account_status: 'suspended',
        suspended_until: suspendedUntil,
        suspension_reason: reason || 'Administrative action'
      })
      .eq('id', userId);
  };

  const unsuspendUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({
        account_status: 'active',
        suspended_until: null,
        suspension_reason: null
      })
      .eq('id', userId);
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
  };

  const sendUserMessage = async (userId: string, message: string) => {
    await supabase
      .from('user_messages')
      .insert({
        user_id: userId,
        sender_type: 'system',
        subject: 'System Message',
        content: message,
        message_type: 'admin_notice'
      });
  };

  const deleteUser = async (userId: string, reason?: string) => {
    // In a real system, this would be more complex with data retention policies
    await supabase
      .from('profiles')
      .update({
        account_status: 'deleted',
        deletion_reason: reason || 'Administrative deletion',
        deleted_at: new Date().toISOString()
      })
      .eq('id', userId);
  };

  const verifyUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ 
        is_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', userId);
  };

  const banUser = async (userId: string, reason?: string) => {
    await supabase
      .from('profiles')
      .update({
        account_status: 'banned',
        ban_reason: reason || 'Administrative ban',
        banned_at: new Date().toISOString()
      })
      .eq('id', userId);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'suspend':
        return <UserX className="h-4 w-4 text-orange-600" />;
      case 'unsuspend':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'change_role':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'send_message':
        return <Mail className="h-4 w-4 text-purple-600" />;
      case 'delete':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'verify':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ban':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const canPerformOperation = (operationType: string) => {
    switch (operationType) {
      case 'suspend':
      case 'unsuspend':
        return hasPermission('manage_user_accounts');
      case 'change_role':
        return hasPermission('manage_user_roles');
      case 'send_message':
        return hasPermission('send_user_messages');
      case 'delete':
      case 'ban':
        return isSuperAdmin;
      case 'verify':
        return hasPermission('verify_users');
      default:
        return false;
    }
  };

  if (selectedUsers.size === 0) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => !processing && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Bulk User Operations
          </DialogTitle>
          <DialogDescription>
            Perform actions on {userCount} selected user{userCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {processing ? (
          <div className="space-y-4">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 mb-4 text-blue-600 animate-spin" />
              <h3 className="font-semibold mb-2">Processing Bulk Operation</h3>
              <p className="text-sm text-muted-foreground mb-4">{currentStep}</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Operation Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Operation</CardTitle>
                <CardDescription>
                  Choose the action to perform on selected users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={operation.type}
                  onValueChange={(value: any) => setOperation({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(operationLabels).map(([key, label]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        disabled={!canPerformOperation(key)}
                      >
                        <div className="flex items-center space-x-2">
                          {getOperationIcon(key)}
                          <span>{label}</span>
                          {!canPerformOperation(key) && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              No Permission
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {operationDescriptions[operation.type]}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Operation-specific inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Operation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(operation.type === 'suspend' || operation.type === 'delete' || operation.type === 'ban') && (
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea
                      placeholder="Enter reason for this action..."
                      value={operation.reason || ''}
                      onChange={(e) => setOperation(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}

                {operation.type === 'suspend' && (
                  <div>
                    <label className="text-sm font-medium">Suspension Duration (days)</label>
                    <Select
                      value={operation.duration?.toString() || 'permanent'}
                      onValueChange={(value) => setOperation(prev => ({ 
                        ...prev, 
                        duration: value === 'permanent' ? undefined : parseInt(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Day</SelectItem>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {operation.type === 'change_role' && (
                  <div>
                    <label className="text-sm font-medium">New Role</label>
                    <Select
                      value={operation.newRole || ''}
                      onValueChange={(value) => setOperation(prev => ({ ...prev, newRole: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visitor">Visitor</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        {isSuperAdmin && (
                          <>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="platform_admin">Platform Admin</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {operation.type === 'send_message' && (
                  <div>
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                      placeholder="Enter message to send to selected users..."
                      value={operation.message || ''}
                      onChange={(e) => setOperation(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Confirmation */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ready to execute bulk operation</p>
                    <p className="text-sm text-muted-foreground">
                      This will affect {userCount} user{userCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={executeBulkOperation}
                      disabled={!canPerformOperation(operation.type)}
                      className={operation.type === 'delete' || operation.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      {getOperationIcon(operation.type)}
                      <span className="ml-2">Execute Operation</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}