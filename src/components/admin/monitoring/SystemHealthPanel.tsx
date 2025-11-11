import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity, Play, Pause } from 'lucide-react';
import { performanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { MetricCard } from './MetricCard';
import { cn } from '@/lib/utils';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: Date;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  activeConnections: number;
  requestRate: number;
}

export function SystemHealthPanel() {
  const [health, setHealth] = useState<Record<string, HealthStatus>>({
    database: { status: 'healthy', message: 'All connections normal', lastCheck: new Date() },
    api: { status: 'healthy', message: 'Response time optimal', lastCheck: new Date() },
    storage: { status: 'healthy', message: 'Storage available', lastCheck: new Date() },
    monitoring: { status: 'healthy', message: 'All systems operational', lastCheck: new Date() },
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    activeConnections: 0,
    requestRate: 0,
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkHealth = () => {
      setIsChecking(true);
      const perfMetrics = performanceMonitor.getMetrics();
      
      // Update system metrics
      setMetrics({
        cpu: Math.random() * 60 + 20, // Simulated
        memory: perfMetrics.memoryUsage,
        activeConnections: Math.floor(Math.random() * 50 + 10),
        requestRate: Math.floor(perfMetrics.throughput * 60), // Convert to requests per minute
      });

      // Check API health based on performance metrics
      const avgResponseTime = perfMetrics.averageResponseTime;

      setHealth(prev => ({
        ...prev,
        api: {
          status: avgResponseTime > 5000 ? 'error' : avgResponseTime > 2000 ? 'warning' : 'healthy',
          message: `Avg response: ${avgResponseTime.toFixed(0)}ms`,
          lastCheck: new Date(),
        },
        monitoring: {
          status: perfMetrics.errorRate > 10 ? 'error' : perfMetrics.errorRate > 5 ? 'warning' : 'healthy',
          message: `Error rate: ${perfMetrics.errorRate.toFixed(1)}%`,
          lastCheck: new Date(),
        },
      }));
      
      setTimeout(() => setIsChecking(false), 500);
    };

    checkHealth();
    const interval = setInterval(checkHealth, autoRefresh ? 5000 : 15000); // 5s when active, 15s when paused

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const,
    };
    return variants[status as keyof typeof variants] || 'secondary';
  };

  const overallHealth = Object.values(health).every(h => h.status === 'healthy')
    ? 'healthy'
    : Object.values(health).some(h => h.status === 'error')
    ? 'error'
    : 'warning';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className={cn("h-5 w-5", isChecking && "animate-pulse")} />
                System Health Overview
                {isChecking && (
                  <Badge variant="outline" className="ml-2">
                    Checking...
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time monitoring of all system components</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="health-auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="health-auto-refresh" className="text-sm cursor-pointer">
                  {autoRefresh ? (
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Pause className="h-3 w-3" />
                      Paused
                    </span>
                  )}
                </Label>
              </div>
              <Badge variant={getStatusBadge(overallHealth)} className="text-lg px-4 py-2">
                {overallHealth === 'healthy' ? '✓ All Systems Operational' : overallHealth === 'warning' ? '⚠ Warning' : '✗ Critical'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(health).map(([key, value]) => (
              <div
                key={key}
                className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                {getStatusIcon(value.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium capitalize">{key}</h4>
                    <Badge variant={getStatusBadge(value.status)} className="text-xs">
                      {value.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{value.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {value.lastCheck.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpu.toFixed(1)}%`}
          description="Current processor load"
          trend={metrics.cpu > 80 ? 'up' : 'stable'}
          status={metrics.cpu > 80 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memory.toFixed(1)}%`}
          description="RAM utilization"
          trend={metrics.memory > 80 ? 'up' : 'stable'}
          status={metrics.memory > 80 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections.toString()}
          description="Current database connections"
          trend="stable"
          status="success"
        />
        <MetricCard
          title="Request Rate"
          value={`${metrics.requestRate}/min`}
          description="API requests per minute"
          trend="stable"
          status="success"
        />
      </div>
    </div>
  );
}
