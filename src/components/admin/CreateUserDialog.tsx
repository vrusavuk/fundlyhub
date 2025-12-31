import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DialogErrorBadge } from "@/components/common/DialogErrorBadge";
import { DialogStatusIndicator } from "@/components/common/DialogStatusIndicator";
import { 
  formatValidationErrors, 
  extractSupabaseError, 
  getErrorTitle 
} from "@/lib/utils/dialogNotifications";
import { logger } from '@/lib/services/logger.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/contexts/RBACContext';
import { useEventPublisher } from '@/hooks/useEventBus';
import { createUserRoleAssignedEvent } from '@/lib/events/domain/AdminEvents';

// Base schema without role enum - role is validated dynamically
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  roleId: z.string().uuid('Please select a role'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin, getHighestRole } = useRBAC();
  const { publish } = useEventPublisher();
  const { roles, isLoading: rolesLoading, getAssignableRoles } = useRoles();
  
  // Get the highest hierarchy level of the current admin
  const adminHighestRole = getHighestRole();
  const adminHierarchyLevel = adminHighestRole?.hierarchy_level ?? 0;
  
  // Filter roles that this admin can assign
  const assignableRoles = getAssignableRoles(adminHierarchyLevel, isSuperAdmin());

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      password: '',
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset();
      setSubmitError(null);
    }
  }, [open, form]);

  const onSubmit = async (data: UserFormData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Find the selected role
      const selectedRole = roles.find(r => r.id === data.roleId);
      if (!selectedRole) {
        throw new Error('Selected role not found');
      }

      // Security: Verify hierarchy level
      if (selectedRole.hierarchy_level > adminHierarchyLevel && !isSuperAdmin()) {
        throw new Error('Cannot assign role with higher hierarchy level');
      }

      // Create user via Supabase Auth Admin API (without role in metadata)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name,
          // Note: Role is NOT stored here - it's assigned via event system
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Assign role via pub/sub event system (single source of truth)
      const roleEvent = createUserRoleAssignedEvent({
        userId: authData.user.id,
        roleId: data.roleId,
        roleName: selectedRole.name,
        assignedBy: user.id,
      });

      await publish(roleEvent);

      toast({
        title: 'User Created',
        description: `${data.name} has been successfully created with the ${selectedRole.display_name} role.`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      logger.error('Error creating user', error instanceof Error ? error : new Error(String(error)), {
        componentName: 'CreateUserDialog',
        operationName: 'onSubmit',
        email: data.email
      });
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user account to the platform. They will receive a welcome email.
          </DialogDescription>
        </DialogHeader>

        {/* Validation errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <DialogErrorBadge
            variant="error"
            title="Form Validation Failed"
            message={formatValidationErrors(form.formState.errors)}
            dismissible
            onDismiss={() => form.clearErrors()}
          />
        )}

        {/* Submit error */}
        {submitError && (
          <DialogErrorBadge
            variant="error"
            title={getErrorTitle(submitError)}
            message={extractSupabaseError(submitError)}
            dismissible
            onDismiss={() => setSubmitError(null)}
          />
        )}

        {/* Status indicator */}
        {isSubmitting && (
          <DialogStatusIndicator
            status="Creating user account..."
            loading
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>
                    User will be prompted to change this on first login
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={rolesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can only assign roles at or below your hierarchy level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || rolesLoading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
