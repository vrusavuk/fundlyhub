import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceMonitor, PerformanceMetrics as PerfMetrics } from '@/lib/monitoring/PerformanceMonitor';
import { MetricCard } from './MetricCard';
import { TrendingUp, Activity, Clock, Zap, AlertTriangle, BarChart } from 'lucide-react';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';

interface PerformanceMetricsProps {
  compact?: boolean;
}

export function PerformanceMetrics({ compact = false }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerfMetrics>(performanceMonitor.getMetrics());
  const { renderCount } = usePerformanceTracking('PerformanceMetrics');

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Snapshot
          </CardTitle>
          <CardDescription>Real-time performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <Badge variant={metrics.averageResponseTime > 1000 ? 'destructive' : 'default'}>
                {metrics.averageResponseTime.toFixed(0)}ms
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Throughput</span>
              </div>
              <Badge variant="default">
                {metrics.throughput.toFixed(1)} req/s
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <Badge variant={metrics.errorRate > 5 ? 'destructive' : 'default'}>
                {metrics.errorRate.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.averageResponseTime.toFixed(0)}ms`}
          description={`${metrics.requestCount} requests tracked`}
          trend={metrics.averageResponseTime > 1000 ? 'up' : metrics.averageResponseTime < 500 ? 'down' : 'stable'}
          status={metrics.averageResponseTime > 1000 ? 'warning' : 'success'}
          icon={Clock}
        />
        <MetricCard
          title="Throughput"
          value={`${metrics.throughput.toFixed(1)} req/s`}
          description="Requests per second"
          trend="stable"
          status="success"
          icon={BarChart}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          description={`${metrics.requestCount} total requests`}
          trend={metrics.errorRate > 5 ? 'up' : 'down'}
          status={metrics.errorRate > 5 ? 'error' : metrics.errorRate > 2 ? 'warning' : 'success'}
          icon={AlertTriangle}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memoryUsage.toFixed(1)}%`}
          description="Current heap utilization"
          trend={metrics.memoryUsage > 80 ? 'up' : 'stable'}
          status={metrics.memoryUsage > 80 ? 'warning' : 'success'}
          icon={Activity}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hit Rate</span>
                <span className="text-sm font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${metrics.cacheHitRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Database Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Query Time</span>
                <span className="text-sm font-medium">{metrics.dbQueryTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Slow Queries</span>
                <Badge variant={metrics.slowQueries > 0 ? 'destructive' : 'default'}>
                  {metrics.slowQueries}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Request Count</span>
                <span className="text-sm font-medium">{metrics.requestCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Monitors</span>
                <Badge variant="default">{renderCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>System performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.averageResponseTime > 1000 && (
              <div className="p-4 border border-warning/20 rounded-lg bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning">Slow Response Time</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Average response time is {metrics.averageResponseTime.toFixed(0)}ms, which exceeds the 1000ms threshold.
                      Consider optimizing database queries or adding caching.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.errorRate > 5 && (
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">High Error Rate</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Error rate is {metrics.errorRate.toFixed(1)}%, which is above the 5% threshold.
                      Check logs for error patterns and investigate root causes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.memoryUsage > 80 && (
              <div className="p-4 border border-warning/20 rounded-lg bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning">High Memory Usage</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Memory usage is at {metrics.memoryUsage.toFixed(1)}%.
                      Consider implementing memory optimization strategies or increasing available resources.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {metrics.averageResponseTime <= 1000 && metrics.errorRate <= 5 && metrics.memoryUsage <= 80 && (
              <div className="p-4 border border-success/20 rounded-lg bg-success/5">
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-medium text-success">Optimal Performance</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      All performance metrics are within healthy ranges. System is operating normally.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
