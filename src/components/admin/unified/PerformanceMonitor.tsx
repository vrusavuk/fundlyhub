import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Clock, Database, Wifi, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  description?: string;
}

interface NetworkMetric {
  type: 'fetch' | 'realtime' | 'mutation';
  duration: number;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  endpoint?: string;
}

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceMonitor({
  className,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 5000,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const metricsRef = useRef<NetworkMetric[]>([]);

  // Performance observer for measuring render times
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          // Add custom performance metrics
          metricsRef.current.push({
            type: 'fetch',
            duration: entry.duration,
            timestamp: new Date(),
            status: 'success',
            endpoint: entry.name,
          });
        }
      });

      // Keep only last 50 metrics
      if (metricsRef.current.length > 50) {
        metricsRef.current = metricsRef.current.slice(-50);
      }

      setNetworkMetrics([...metricsRef.current]);
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    return () => observer.disconnect();
  }, []);

  // Memory usage monitoring
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        setMemoryUsage(usedPercent);
      }
    };

    measureMemory();
    const interval = autoRefresh ? setInterval(measureMemory, refreshInterval) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  // Calculate performance metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const recentMetrics = networkMetrics.slice(-10);
      const avgResponseTime = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;

      const errorRate = recentMetrics.length > 0
        ? (recentMetrics.filter(m => m.status === 'error').length / recentMetrics.length) * 100
        : 0;

      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Response Time',
          value: Math.round(avgResponseTime),
          unit: 'ms',
          threshold: 1000,
          status: avgResponseTime < 500 ? 'good' : avgResponseTime < 1000 ? 'warning' : 'critical',
          description: 'Average API response time',
        },
        {
          name: 'Error Rate',
          value: Math.round(errorRate * 10) / 10,
          unit: '%',
          threshold: 5,
          status: errorRate < 1 ? 'good' : errorRate < 5 ? 'warning' : 'critical',
          description: 'Percentage of failed requests',
        },
        {
          name: 'Memory Usage',
          value: Math.round(memoryUsage * 10) / 10,
          unit: '%',
          threshold: 80,
          status: memoryUsage < 60 ? 'good' : memoryUsage < 80 ? 'warning' : 'critical',
          description: 'JavaScript heap memory usage',
        },
        {
          name: 'Total Requests',
          value: networkMetrics.length,
          unit: 'count',
          threshold: 100,
          status: 'good',
          description: 'Total network requests made',
        },
      ];

      setMetrics(newMetrics);
    };

    calculateMetrics();
  }, [networkMetrics, memoryUsage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-status-success bg-status-success-light';
      case 'warning':
        return 'text-status-warning bg-status-warning-light';
      case 'critical':
        return 'text-status-error bg-status-error-light';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Zap className="h-4 w-4 text-status-success" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-status-warning" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-status-error" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!showDetails) {
    // Compact view
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Performance:</span>
        
        {criticalCount > 0 && (
          <Badge variant="destructive" className="text-xs px-1 py-0">
            {criticalCount} critical
          </Badge>
        )}
        
        {warningCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {warningCount} warnings
          </Badge>
        )}
        
        {criticalCount === 0 && warningCount === 0 && (
          <Badge variant="default" className="text-xs px-1 py-0">
            All good
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Real-time performance metrics and system health
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <TooltipProvider key={metric.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-help">
                    <div className="flex items-center justify-between mb-2">
                      {getStatusIcon(metric.status)}
                      <Badge className={cn("text-xs px-1 py-0", getStatusColor(metric.status))}>
                        {metric.status}
                      </Badge>
                    </div>
                    
                    <div className="text-2xl font-bold">
                      {metric.value}
                      <span className="text-sm text-muted-foreground ml-1">
                        {metric.unit}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {metric.name}
                    </div>

                    {/* Progress bar for percentage metrics */}
                    {metric.unit === '%' && (
                      <Progress 
                        value={metric.value} 
                        className="mt-2 h-1"
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                    <p className="text-xs">Threshold: {metric.threshold}{metric.unit}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Recent Network Activity */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Recent Network Activity
          </h4>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {networkMetrics.slice(-5).map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded text-xs bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    metric.status === 'success' ? 'bg-status-success' :
                    metric.status === 'error' ? 'bg-status-error' : 'bg-status-warning'
                  )} />
                  
                  <span className="text-muted-foreground">
                    {metric.type.toUpperCase()}
                  </span>
                  
                  {metric.endpoint && (
                    <span className="font-mono truncate max-w-32">
                      {metric.endpoint}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span>{Math.round(metric.duration)}ms</span>
                  <span className="text-muted-foreground">
                    {metric.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {networkMetrics.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No network activity recorded
              </div>
            )}
          </div>
        </div>

        {/* Performance Tips */}
        {metrics.some(m => m.status !== 'good') && (
          <div className="p-3 rounded-lg bg-status-warning-light border border-status-warning-border">
            <h4 className="text-sm font-medium text-status-warning mb-1">
              Performance Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {metrics.filter(m => m.status === 'critical').length > 0 && (
                <li>• Critical issues detected - check network and server performance</li>
              )}
              {memoryUsage > 80 && (
                <li>• High memory usage - consider refreshing the page</li>
              )}
              {networkMetrics.filter(m => m.status === 'error').length > 3 && (
                <li>• Multiple network errors detected - check connection</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
