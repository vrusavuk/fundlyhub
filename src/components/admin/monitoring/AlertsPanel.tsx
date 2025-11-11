import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, X, Play, Pause } from 'lucide-react';
import { useAlertMonitoring } from '@/hooks/useAlertMonitoring';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  limit?: number;
}

export function AlertsPanel({ limit }: AlertsPanelProps) {
  const { alerts, clearAlerts, getStatistics } = useAlertMonitoring();
  const stats = getStatistics();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasNewAlerts, setHasNewAlerts] = useState(false);

  useEffect(() => {
    if (alerts.length > 0) {
      setHasNewAlerts(true);
      const timer = setTimeout(() => setHasNewAlerts(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [alerts.length]);

  const displayedAlerts = limit ? alerts.slice(0, limit) : alerts;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'low':
        return <Bell className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className={cn("h-5 w-5", hasNewAlerts && "animate-pulse text-destructive")} />
              System Alerts
              {alerts.length > 0 && (
                <Badge variant="destructive" className={cn("ml-2", hasNewAlerts && "animate-pulse")}>
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Active alerts and notifications
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="alerts-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="alerts-auto-refresh" className="text-sm cursor-pointer">
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
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAlerts()}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{stats.bySeverity.critical || 0}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{stats.bySeverity.high || 0}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{stats.bySeverity.medium || 0}</p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.bySeverity.low || 0}</p>
            <p className="text-xs text-muted-foreground">Low</p>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {displayedAlerts.length === 0 ? (
            <Alert className="border-success/50 bg-success/5">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                No active alerts. All systems operating normally.
              </AlertDescription>
            </Alert>
          ) : (
            displayedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/5 transition-all",
                  hasNewAlerts && "animate-in fade-in-50 slide-in-from-top-2"
                )}
              >
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium">{alert.ruleName}</h4>
                    <Badge variant={getSeverityBadge(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Rule: {alert.ruleId}</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAlerts(alert.ruleId)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {limit && alerts.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {alerts.length} Alerts
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
