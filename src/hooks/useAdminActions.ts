/**
 * Admin Actions Hook with Permission Checks
 * Centralizes admin actions with automatic permission validation
 * Follows Single Responsibility - action execution with security
 */

import { useCallback } from 'react';
import { useRBAC } from './useRBAC';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminDataService } from '@/lib/services/AdminDataService';

interface ActionOptions {
  permission?: string;
  confirmMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAdminActions() {
  const { hasPermission } = useRBAC();
  const { toast } = useToast();

  const executeAction = useCallback(async <T>(
    action: () => Promise<T>,
    options: ActionOptions = {}
  ): Promise<T | null> => {
    const {
      permission,
      confirmMessage,
      successMessage,
      errorMessage = 'Action failed',
      onSuccess,
      onError
    } = options;

    // Check permission
    if (permission && !hasPermission(permission)) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action',
        variant: 'destructive'
      });
      return null;
    }

    // Confirm if needed
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return null;
    }

    try {
      const result = await action();
      
      if (successMessage) {
        toast({
          title: 'Success',
          description: successMessage
        });
      }

      onSuccess?.();
      return result;
    } catch (error) {
      console.error('Action error:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : errorMessage,
        variant: 'destructive'
      });

      onError?.(error as Error);
      return null;
    }
  }, [hasPermission, toast]);

  const updateUserStatus = useCallback(async (
    userId: string,
    status: string,
    reason?: string
  ) => {
    return executeAction(
      async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ account_status: status as any })
          .eq('id', userId);

        if (error) throw error;

        // Log action
        await supabase.rpc('log_audit_event', {
          _actor_id: (await supabase.auth.getUser()).data.user?.id,
          _action: `user_status_changed_to_${status}`,
          _resource_type: 'user',
          _resource_id: userId,
          _metadata: { status, reason }
        });

        adminDataService.invalidateCache('users');
      },
      {
        permission: 'manage_users',
        successMessage: `User status updated to ${status}`,
        errorMessage: 'Failed to update user status'
      }
    );
  }, [executeAction]);

  const updateCampaignStatus = useCallback(async (
    campaignId: string,
    status: string
  ) => {
    return executeAction(
      async () => {
        const { error } = await supabase
          .from('fundraisers')
          .update({ status: status as any })
          .eq('id', campaignId);

        if (error) throw error;

        await supabase.rpc('log_audit_event', {
          _actor_id: (await supabase.auth.getUser()).data.user?.id,
          _action: `campaign_${status}`,
          _resource_type: 'campaign',
          _resource_id: campaignId,
          _metadata: { status }
        });

        adminDataService.invalidateCache('campaigns');
      },
      {
        permission: 'approve_campaigns',
        successMessage: `Campaign ${status} successfully`,
        errorMessage: 'Failed to update campaign status'
      }
    );
  }, [executeAction]);

  const updateOrganizationStatus = useCallback(async (
    orgId: string,
    verificationStatus: string
  ) => {
    return executeAction(
      async () => {
        const { error } = await supabase
          .from('organizations')
          .update({ verification_status: verificationStatus as any })
          .eq('id', orgId);

        if (error) throw error;

        await supabase.rpc('log_audit_event', {
          _actor_id: (await supabase.auth.getUser()).data.user?.id,
          _action: `organization_${verificationStatus}`,
          _resource_type: 'organization',
          _resource_id: orgId,
          _metadata: { verificationStatus }
        });

        adminDataService.invalidateCache('organizations');
      },
      {
        permission: 'verify_organizations',
        successMessage: `Organization ${verificationStatus} successfully`,
        errorMessage: 'Failed to update organization status'
      }
    );
  }, [executeAction]);

  const deleteResource = useCallback(async (
    resourceType: 'user' | 'campaign' | 'organization',
    resourceId: string,
    tableName: string
  ) => {
    return executeAction(
      async () => {
        const { error } = await supabase
          .from(tableName as any)
          .delete()
          .eq('id', resourceId);

        if (error) throw error;

        await supabase.rpc('log_audit_event', {
          _actor_id: (await supabase.auth.getUser()).data.user?.id,
          _action: `${resourceType}_deleted`,
          _resource_type: resourceType,
          _resource_id: resourceId
        });

        const cacheKey = resourceType === 'campaign' ? 'campaigns' : resourceType === 'organization' ? 'organizations' : 'users';
        adminDataService.invalidateCache(cacheKey);
      },
      {
        permission: `delete_${resourceType}s`,
        confirmMessage: `Are you sure you want to delete this ${resourceType}? This action cannot be undone.`,
        successMessage: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} deleted successfully`,
        errorMessage: `Failed to delete ${resourceType}`
      }
    );
  }, [executeAction]);

  return {
    executeAction,
    updateUserStatus,
    updateCampaignStatus,
    updateOrganizationStatus,
    deleteResource
  };
}
