import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminPageLayout, PageSection, PageGrid } from './unified';
import { ContextualHelp } from '@/components/admin/ContextualHelp';
import { OptimisticUpdateIndicator, useOptimisticUpdates } from '@/components/admin/OptimisticUpdates';
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp,
  Download,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Palette,
  Code,
  Eye,
  MoreHorizontal,
  FileText
} from 'lucide-react';

interface DesignSystemShowcaseProps {
  className?: string;
}

export function DesignSystemShowcase({ className }: DesignSystemShowcaseProps) {
  const [selectedComponent, setSelectedComponent] = useState<string>('headers');

  // Demo optimistic updates
  const optimisticUpdates = useOptimisticUpdates({
    onSuccess: () => console.log('Demo action completed'),
    onError: (action, error) => console.error('Demo action failed:', error)
  });

  const helpContent = {
    title: "Design System Guide",
    description: "Learn how to use the enhanced admin design system components effectively.",
    tips: [
      "EnhancedPageHeader provides unified page headers with actions",
      "OptimisticUpdates give instant feedback for better UX",
      "Use consistent spacing and typography tokens"
    ],
    shortcuts: [
      { key: "Tab", description: "Navigate between interactive elements" },
      { key: "Enter", description: "Activate focused element" }
    ]
  };

  const runDemoAction = async () => {
    return optimisticUpdates.executeAction(
      {
        type: 'update',
        description: 'Demo optimistic update action',
        originalData: {},
        rollbackFn: async () => {
          console.log('Demo rollback executed');
        }
      },
      async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Randomly succeed or fail for demo
        if (Math.random() > 0.3) {
          return { success: true };
        } else {
          throw new Error('Demo API failure');
        }
      }
    );
  };

  return (
    <AdminPageLayout
      title="Design System"
      description="Comprehensive showcase of enhanced admin panel components and patterns"
      badge={{ text: 'v2.0', variant: 'default' }}
      actions={
        <>
          <Button variant="outline" onClick={() => console.log('View docs')}>
            <Code className="mr-2 h-4 w-4" />
            View Docs
          </Button>
          <Button onClick={runDemoAction}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Demo
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <ContextualHelp content={helpContent} variant="popover" placement="bottom" />
      </div>

      {/* Component Showcase Tabs */}
      <Tabs value={selectedComponent} onValueChange={setSelectedComponent} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="headers">Page Headers</TabsTrigger>
          <TabsTrigger value="optimistic">Optimistic Updates</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="headers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Page Headers</CardTitle>
              <CardDescription>
                Standardized page headers with flexible action buttons and contextual help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-2">AdminPageLayout Component</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The AdminPageLayout component provides a consistent structure for all admin pages
                    with a white header section and gray content area.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">title</Badge>
                      <span className="text-muted-foreground">Page title</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">description</Badge>
                      <span className="text-muted-foreground">Optional subtitle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">badge</Badge>
                      <span className="text-muted-foreground">Optional badge configuration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">actions</Badge>
                      <span className="text-muted-foreground">Action buttons or components</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Benefits:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Consistent spacing and typography across all admin pages</li>
                    <li>• Flexible action button system with loading states</li>
                    <li>• Built-in responsive design for mobile devices</li>
                    <li>• Semantic HTML structure for accessibility</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimistic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimistic Updates</CardTitle>
              <CardDescription>
                Instant feedback for better user experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Demo Action</h4>
                <div className="flex items-center space-x-2 mb-4">
                  <Button onClick={runDemoAction} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Demo Action
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Click to see optimistic updates in action
                  </span>
                </div>
                <OptimisticUpdateIndicator
                  state={optimisticUpdates.state}
                  onRollback={optimisticUpdates.rollbackAction}
                  onClearCompleted={optimisticUpdates.clearCompleted}
                  onClearFailed={optimisticUpdates.clearFailed}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback Systems</CardTitle>
              <CardDescription>
                Optimistic updates and contextual help for better user experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Optimistic Updates</h4>
                <div className="flex items-center space-x-2 mb-4">
                  <Button onClick={runDemoAction} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Demo Action
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Click to see optimistic updates in action
                  </span>
                </div>
                <OptimisticUpdateIndicator
                  state={optimisticUpdates.state}
                  onRollback={optimisticUpdates.rollbackAction}
                  onClearCompleted={optimisticUpdates.clearCompleted}
                  onClearFailed={optimisticUpdates.clearFailed}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Contextual Help</h4>
                <div className="flex items-center space-x-2">
                  <ContextualHelp
                    content={helpContent}
                    variant="popover"
                    placement="right"
                  />
                  <span className="text-sm text-muted-foreground">
                    Click the help icon to see contextual assistance
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">UX Improvements:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Instant feedback with optimistic updates</li>
                  <li>• Contextual help reduces support requests</li>
                  <li>• Clear success/error states with rollback options</li>
                  <li>• Keyboard navigation support throughout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}