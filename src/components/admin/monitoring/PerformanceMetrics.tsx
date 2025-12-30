import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { performanceMonitor, PerformanceMetrics as PerfMetrics } from '@/lib/monitoring/PerformanceMonitor';
import { MetricCard } from './MetricCard';
import { TrendingUp, Activity, Clock, Zap, AlertTriangle, BarChart, Play, Pause } from 'lucide-react';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { cn } from '@/lib/utils';

interface PerformanceMetricsProps {
  compact?: boolean;
}

export function PerformanceMetrics({ compact = false }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerfMetrics>(performanceMonitor.getMetrics());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { renderCount } = usePerformanceTracking('PerformanceMetrics');
  const previousMetricsRef = useRef<PerfMetrics>(metrics);

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = performanceMonitor.getMetrics();
      
      // Check if metrics have changed significantly
      const hasChanged = 
        Math.abs(newMetrics.averageResponseTime - previousMetricsRef.current.averageResponseTime) > 10 ||
        Math.abs(newMetrics.errorRate - previousMetricsRef.current.errorRate) > 0.5;
      
      if (hasChanged) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 1000);
      }
      
      previousMetricsRef.current = newMetrics;
      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, autoRefresh ? 2000 : 10000); // 2s when active, 10s when paused

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Snapshot
                {isUpdating && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    Updating
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Real-time performance indicators</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="perf-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="perf-auto-refresh" className="text-sm cursor-pointer">
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
          </div>
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
      {/* Auto-refresh control for full view */}
      {!compact && (
        <div className="flex items-center justify-end gap-2 p-4 bg-muted/30 rounded-lg">
          <Switch
            id="perf-full-auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="perf-full-auto-refresh" className="text-sm cursor-pointer">
            {autoRefresh ? (
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Live Updates (2s)
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Pause className="h-3 w-3" />
                Paused (10s)
              </span>
            )}
          </Label>
          {isUpdating && (
            <Badge variant="outline" className="ml-2 animate-pulse">
              Updating...
            </Badge>
          )}
        </div>
      )}
      
      {/* Key Metrics */}
      <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", isUpdating && "opacity-90 transition-opacity")}>
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
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
