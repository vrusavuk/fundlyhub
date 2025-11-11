import { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/design/typography';
import { logger } from '@/lib/services/logger.service';

interface OptimisticAction {
  id: string;
  type: 'approve' | 'suspend' | 'delete' | 'update' | 'create';
  description: string;
  originalData?: any;
  rollbackFn?: () => Promise<void>;
  timestamp: number;
}

interface UseOptimisticUpdatesOptions {
  onSuccess?: (action: OptimisticAction) => void;
  onError?: (action: OptimisticAction, error: any) => void;
  onRollback?: (action: OptimisticAction) => void;
  skipToast?: boolean; // Skip toast notifications for dialog-initiated actions
}

interface OptimisticUpdatesState {
  pendingActions: OptimisticAction[];
  completedActions: OptimisticAction[];
  failedActions: OptimisticAction[];
}

export function useOptimisticUpdates(options: UseOptimisticUpdatesOptions = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<OptimisticUpdatesState>({
    pendingActions: [],
    completedActions: [],
    failedActions: []
  });

  const addPendingAction = useCallback((action: Omit<OptimisticAction, 'id' | 'timestamp'>) => {
    const optimisticAction: OptimisticAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, optimisticAction]
    }));
    
    return optimisticAction;
  }, []);

  const executeAction = useCallback(
    async <T,>(
      actionData: Omit<OptimisticAction, 'id' | 'timestamp'>,
      asyncFn: () => Promise<T>,
      skipToast: boolean = options?.skipToast || false
    ): Promise<T> => {
      const action = addPendingAction(actionData);
      
      try {
        const result = await asyncFn();
        
        // Move from pending to completed
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(a => a.id !== action.id),
          completedActions: [...prev.completedActions, action]
        }));
        
        if (!skipToast) {
          toast({
            title: 'Success',
            description: `${action.description} completed successfully`,
            variant: 'default'
          });
        }
        
        options.onSuccess?.(action);
        return result;
      } catch (error) {
        // Move from pending to failed
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(a => a.id !== action.id),
          failedActions: [...prev.failedActions, action]
        }));
        
        // Enhanced error extraction with comprehensive logging
        logger.debug('Processing optimistic update error', {
          componentName: 'OptimisticUpdates',
          operationName: 'executeAction',
        });
        
        let errorMessage = "An unexpected error occurred";
        
        if (error && typeof error === 'object') {
          const supabaseError = error as any;
          
          // Log full error structure for debugging
          logger.error('Supabase error in optimistic update', error as Error, {
            componentName: 'OptimisticUpdates',
            metadata: {
              code: supabaseError.code,
              message: supabaseError.message,
              details: supabaseError.details,
              hint: supabaseError.hint,
              error_description: supabaseError.error_description,
            },
          });
          
          // Check for RLS policy violation (42501 is PostgreSQL's permission denied code)
          if (supabaseError.code === '42501' || 
              supabaseError.message?.includes('row-level security') ||
              supabaseError.message?.includes('policy')) {
            errorMessage = "Permission denied: You don't have access to perform this action";
            logger.warn('RLS policy violation detected', {
              componentName: 'OptimisticUpdates',
              metadata: { code: supabaseError.code },
            });
          }
          // Check for other PostgreSQL errors
          else if (supabaseError.code) {
            const friendlyMessages: Record<string, string> = {
              '23505': 'This record already exists',
              '23503': 'Related record not found',
              '23502': 'Required field is missing',
              '22P02': 'Invalid input format',
              'PGRST116': 'No rows returned from query'
            };
            
            errorMessage = friendlyMessages[supabaseError.code] || 
              `Database error (${supabaseError.code}): ${supabaseError.message || supabaseError.hint || 'Unknown error'}`;
          }
          // Generic Supabase error
          else if (supabaseError.message) {
            errorMessage = supabaseError.message;
          } else if (supabaseError.error_description) {
            errorMessage = supabaseError.error_description;
          } else if (supabaseError.details) {
            errorMessage = supabaseError.details;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        logger.error('Final error message extracted', undefined, {
          componentName: 'OptimisticUpdates',
          metadata: { errorMessage },
        });
        
        if (!skipToast) {
          toast({
            title: 'Action Failed',
            description: errorMessage,
            variant: 'destructive'
          });
        }
        
        options.onError?.(action, error);
        throw error;
      }
    },
    [addPendingAction, toast, options]
  );

  const rollbackAction = useCallback(async (actionId: string) => {
    const action = state.failedActions.find(a => a.id === actionId);
    if (!action?.rollbackFn) return;
    
    try {
      await action.rollbackFn();
      
      setState(prev => ({
        ...prev,
        failedActions: prev.failedActions.filter(a => a.id !== actionId)
      }));
      
      toast({
        title: 'Rolled Back',
        description: `${action.description} has been rolled back`,
        variant: 'default'
      });
      
      options.onRollback?.(action);
    } catch (error) {
      toast({
        title: 'Rollback Failed',
        description: 'Could not rollback the action',
        variant: 'destructive'
      });
    }
  }, [state.failedActions, toast, options]);

  const clearCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedActions: []
    }));
  }, []);

  const clearFailed = useCallback(() => {
    setState(prev => ({
      ...prev,
      failedActions: []
    }));
  }, []);

  return {
    state,
    executeAction,
    rollbackAction,
    clearCompleted,
    clearFailed,
    hasPendingActions: state.pendingActions.length > 0,
    hasFailedActions: state.failedActions.length > 0
  };
}

interface OptimisticUpdateIndicatorProps {
  state: OptimisticUpdatesState;
  onRollback: (actionId: string) => void;
  onClearCompleted: () => void;
  onClearFailed: () => void;
  className?: string;
}

export function OptimisticUpdateIndicator({
  state,
  onRollback,
  onClearCompleted,
  onClearFailed,
  className
}: OptimisticUpdateIndicatorProps) {
  const { pendingActions, completedActions, failedActions } = state;
  
  if (pendingActions.length === 0 && completedActions.length === 0 && failedActions.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 max-w-sm",
      "card-enhanced p-4 shadow-medium bg-background/95 backdrop-blur-sm",
      "border border-primary/10",
      className
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className={getTypographyClasses('heading', 'sm', 'text-foreground')}>
            Activity Status
          </h4>
          <div className="flex items-center space-x-1">
            {completedActions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCompleted}
                className="text-xs h-6 px-2 hover:bg-success/10 text-success"
              >
                Clear completed
              </Button>
            )}
            {failedActions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFailed}
                className="text-xs h-6 px-2 hover:bg-destructive/10 text-destructive"
              >
                Clear failed
              </Button>
            )}
          </div>
        </div>

        {/* Pending Actions */}
        {pendingActions.map((action) => (
          <div key={action.id} className="flex items-center space-x-3 p-2 bg-primary/5 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <div className="flex-1 min-w-0">
              <p className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                {action.description}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Pending
            </Badge>
          </div>
        ))}

        {/* Completed Actions */}
        {completedActions.slice(-3).map((action) => (
          <div key={action.id} className="flex items-center space-x-3 p-2 bg-success/10 rounded-md">
            <CheckCircle className="h-4 w-4 text-success" />
            <div className="flex-1 min-w-0">
              <p className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                {action.description}
              </p>
            </div>
            <Badge variant="success" className="text-xs">
              Done
            </Badge>
          </div>
        ))}

        {/* Failed Actions */}
        {failedActions.map((action) => (
          <div key={action.id} className="flex items-center space-x-3 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                {action.description}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {action.rollbackFn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRollback(action.id)}
                  className="text-xs h-6 px-2 hover:bg-destructive/20"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo
                </Button>
              )}
              <Badge variant="destructive" className="text-xs">
                Failed
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}