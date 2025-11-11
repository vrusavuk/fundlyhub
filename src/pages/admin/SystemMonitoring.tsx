import { useState } from 'react';
import { AdminPageLayout, PageSection } from '@/components/admin/unified';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRBAC } from '@/contexts/RBACContext';
import { LogsViewer } from '@/components/admin/monitoring/LogsViewer';
import { PerformanceMetrics } from '@/components/admin/monitoring/PerformanceMetrics';
import { AlertsPanel } from '@/components/admin/monitoring/AlertsPanel';
import { SystemHealthPanel } from '@/components/admin/monitoring/SystemHealthPanel';
import { DatabaseSecurityPanel } from '@/components/admin/monitoring/DatabaseSecurityPanel';
import { Activity, TrendingUp, Bell, Server, Database } from 'lucide-react';

export default function SystemMonitoring() {
  const { isSuperAdmin } = useRBAC();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminPageLayout
      title="System Monitoring"
      description="Real-time logs, performance metrics, alerts, and system health"
      badge={{
        text: isSuperAdmin() ? 'Super Admin Access' : 'Admin Access',
        variant: isSuperAdmin() ? 'destructive' : 'default'
      }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PageSection spacing="normal">
            <SystemHealthPanel />
          </PageSection>
          
          <PageSection spacing="normal">
            <div className="grid gap-6 md:grid-cols-2">
              <AlertsPanel limit={5} />
              <PerformanceMetrics compact />
            </div>
          </PageSection>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <PageSection spacing="normal">
            <DatabaseSecurityPanel />
          </PageSection>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PageSection spacing="normal">
            <PerformanceMetrics />
          </PageSection>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <PageSection spacing="normal">
            <AlertsPanel />
          </PageSection>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <PageSection spacing="normal">
            <LogsViewer />
          </PageSection>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
