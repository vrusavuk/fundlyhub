import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CreateSampleAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const assignAdminRole = async (roleName: 'super_admin' | 'platform_admin') => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get the role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (roleError) throw roleError;

      // Assign the role to the current user
      const { error: assignError } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: user.id,
          role_id: roleData.id,
          context_type: 'global',
          assigned_by: user.id
        });

      if (assignError) {
        // If it already exists, that's okay
        if (!assignError.message.includes('duplicate')) {
          throw assignError;
        }
      }

      setAdminRole(roleName);
      toast({
        title: 'Admin role assigned',
        description: `You now have ${roleName.replace('_', ' ')} access. Refresh the page to see admin features.`,
      });

    } catch (error) {
      console.error('Error assigning admin role:', error);
      toast({
        title: 'Failed to assign role',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentRole = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select('roles(name)')
        .eq('user_id', user.id)
        .eq('context_type', 'global')
        .eq('is_active', true);

      if (error) throw error;

      const currentRoles = data?.map(assignment => assignment.roles?.name).filter(Boolean) || [];
      
      if (currentRoles.includes('super_admin')) {
        setAdminRole('super_admin');
      } else if (currentRoles.includes('platform_admin')) {
        setAdminRole('platform_admin');
      }
    } catch (error) {
      console.error('Error checking current role:', error);
    }
  };

  // Check current role on component mount
  useState(() => {
    checkCurrentRole();
  });

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to assign admin roles.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Role Assignment
        </CardTitle>
        <CardDescription>
          Assign admin roles to your account for testing the admin panel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {adminRole && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You currently have <Badge variant="secondary">{adminRole.replace('_', ' ')}</Badge> role.
              <br />
              <a href="/admin" className="text-primary underline">
                Access Admin Panel →
              </a>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => assignAdminRole('super_admin')}
            disabled={loading || adminRole === 'super_admin'}
            className="w-full"
            variant={adminRole === 'super_admin' ? 'secondary' : 'default'}
          >
            <Crown className="mr-2 h-4 w-4" />
            {adminRole === 'super_admin' ? 'Super Admin (Active)' : 'Assign Super Admin'}
          </Button>
          
          <Button
            onClick={() => assignAdminRole('platform_admin')}
            disabled={loading || adminRole !== null}
            className="w-full"
            variant={adminRole === 'platform_admin' ? 'secondary' : 'outline'}
          >
            <Shield className="mr-2 h-4 w-4" />
            {adminRole === 'platform_admin' ? 'Platform Admin (Active)' : 'Assign Platform Admin'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Super Admin:</strong> Full platform access with all permissions</p>
          <p><strong>Platform Admin:</strong> Limited admin access without super admin powers</p>
        </div>
      </CardContent>
    </Card>
  );
}