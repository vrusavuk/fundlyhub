import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Archive, 
  Download, 
  Mail, 
  UserX, 
  UserCheck,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface BulkOperation {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'secondary';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface BulkOperationsProps {
  selectedCount: number;
  totalCount: number;
  operations: BulkOperation[];
  onOperation: (operationKey: string) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export function BulkOperations({
  selectedCount,
  totalCount,
  operations,
  onOperation,
  onClearSelection,
  className,
}: BulkOperationsProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOperation, setConfirmOperation] = useState<BulkOperation | null>(null);

  const handleOperation = async (operation: BulkOperation) => {
    if (operation.requiresConfirmation) {
      setConfirmOperation(operation);
      return;
    }

    await executeOperation(operation);
  };

  const executeOperation = async (operation: BulkOperation) => {
    setIsProcessing(true);
    try {
      await onOperation(operation.key);
      toast({
        title: "Operation completed",
        description: `Successfully processed ${selectedCount} item${selectedCount > 1 ? 's' : ''}`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: "There was an error processing the selected items",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setConfirmOperation(null);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border/50",
        className
      )}>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {selectedCount} selected
          </Badge>
          
          <span className="text-sm text-muted-foreground">
            of {totalCount} total
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {operations.slice(0, 2).map((operation) => {
            const IconComponent = operation.icon;
            return (
              <Button
                key={operation.key}
                variant={operation.variant || 'outline'}
                size="sm"
                onClick={() => handleOperation(operation)}
                disabled={isProcessing || operation.disabled}
                className="gap-2"
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {operation.label}
              </Button>
            );
          })}

          {/* More Actions Dropdown */}
          {operations.length > 2 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {operations.slice(2).map((operation, index) => {
                  const IconComponent = operation.icon;
                  return (
                    <React.Fragment key={operation.key}>
                      {index > 0 && operation.variant === 'destructive' && (
                        <DropdownMenuSeparator />
                      )}
                      <DropdownMenuItem
                        onClick={() => handleOperation(operation)}
                        disabled={operation.disabled}
                        className={cn(
                          "gap-2",
                          operation.variant === 'destructive' && 
                          "text-destructive focus:text-destructive"
                        )}
                      >
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        {operation.label}
                        {operation.disabled && operation.disabledReason && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {operation.disabledReason}
                          </span>
                        )}
                      </DropdownMenuItem>
                    </React.Fragment>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmOperation} onOpenChange={() => setConfirmOperation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>
                {confirmOperation?.confirmationTitle || `Confirm ${confirmOperation?.label}`}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {confirmOperation?.confirmationDescription || 
                `Are you sure you want to ${confirmOperation?.label.toLowerCase()} ${selectedCount} selected item${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmOperation && executeOperation(confirmOperation)}
              disabled={isProcessing}
              className={confirmOperation?.variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Predefined bulk operations for common use cases
export const CommonBulkOperations = {
  users: {
    activate: {
      key: 'activate',
      label: 'Activate',
      icon: UserCheck,
      variant: 'default' as const,
    },
    deactivate: {
      key: 'deactivate',
      label: 'Deactivate',
      icon: UserX,
      variant: 'secondary' as const,
      requiresConfirmation: true,
    },
    sendEmail: {
      key: 'sendEmail',
      label: 'Send Email',
      icon: Mail,
      variant: 'outline' as const,
    },
    export: {
      key: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline' as const,
    },
    delete: {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      requiresConfirmation: true,
      confirmationTitle: 'Delete Users',
      confirmationDescription: 'This will permanently delete the selected users and all their associated data.',
    },
  },
  campaigns: {
    approve: {
      key: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      variant: 'default' as const,
    },
    archive: {
      key: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'secondary' as const,
      requiresConfirmation: true,
    },
    export: {
      key: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline' as const,
    },
    delete: {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      requiresConfirmation: true,
    },
  },
  organizations: {
    activate: {
      key: 'activate',
      label: 'Activate',
      icon: CheckCircle,
      variant: 'default' as const,
    },
    deactivate: {
      key: 'deactivate',
      label: 'Suspend',
      icon: UserX,
      variant: 'secondary' as const,
      requiresConfirmation: true,
    },
    export: {
      key: 'export',
      label: 'Export',
      icon: Download,
      variant: 'outline' as const,
    },
    delete: {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      requiresConfirmation: true,
    },
  },
};