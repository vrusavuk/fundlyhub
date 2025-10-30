import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate?: Date | null;
  eventCount?: number;
  error?: Error | null;
  onReconnect?: () => void;
  className?: string;
  variant?: 'minimal' | 'detailed' | 'badge';
}

export function RealTimeIndicator({
  isConnected,
  connectionStatus,
  lastUpdate,
  eventCount = 0,
  error,
  onReconnect,
  className,
  variant = 'detailed',
}: RealTimeIndicatorProps) {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-status-success" />;
      case 'connecting':
        return <Wifi className="h-3 w-3 text-status-warning animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-status-error" />;
      default:
        return <WifiOff className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live updates active';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-status-success';
      case 'connecting':
        return 'bg-status-warning';
      case 'error':
        return 'bg-status-error';
      default:
        return 'bg-muted-foreground';
    }
  };

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2",
              className
            )}>
              <div className={cn(
                "h-2 w-2 rounded-full",
                getStatusColor(),
                connectionStatus === 'connecting' && "animate-pulse"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>{getStatusText()}</p>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </p>
              )}
              {eventCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {eventCount} events received
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'badge') {
    return (
      <Badge
        variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
        className={cn("gap-1 text-xs", className)}
      >
        {getStatusIcon()}
        {getStatusText()}
        {eventCount > 0 && (
          <span className="ml-1 px-1 py-0 text-xs bg-background/20 rounded">
            {eventCount}
          </span>
        )}
      </Badge>
    );
  }

  // Detailed variant
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground",
      connectionStatus === 'connected' && "border-status-success-border bg-status-success-light",
      connectionStatus === 'error' && "border-status-error-border bg-status-error-light",
      className
    )}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{getStatusText()}</span>
            {eventCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {eventCount} updates
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
            
            {connectionStatus === 'connected' && (
              <span className="flex items-center gap-1">
                <div className="h-1 w-1 bg-status-success rounded-full animate-pulse" />
                Real-time
              </span>
            )}
          </div>

          {error && (
            <div className="text-xs text-destructive mt-1">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>

      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="gap-2"
        >
          <RotateCcw className="h-3 w-3" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

// Component for displaying multiple real-time connections
export function MultipleRealTimeIndicator({
  connections,
  className,
}: {
  connections: Array<{
    name: string;
    isConnected: boolean;
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
    eventCount: number;
  }>;
  className?: string;
}) {
  const totalEvents = connections.reduce((sum, conn) => sum + conn.eventCount, 0);
  const connectedCount = connections.filter(conn => conn.isConnected).length;
  const hasErrors = connections.some(conn => conn.connectionStatus === 'error');

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Real-time Connections</h3>
        <Badge 
          variant={hasErrors ? 'destructive' : connectedCount === connections.length ? 'default' : 'secondary'}
          className="text-xs"
        >
          {connectedCount}/{connections.length} connected
        </Badge>
      </div>

      <div className="grid gap-2">
        {connections.map((connection, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded border bg-card">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                connection.isConnected ? "bg-status-success" : "bg-status-error",
                connection.connectionStatus === 'connecting' && "animate-pulse bg-status-warning"
              )} />
              <span className="text-sm">{connection.name}</span>
            </div>
            
            {connection.eventCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {connection.eventCount}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {totalEvents > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {totalEvents} total events received
        </div>
      )}
    </div>
  );
}