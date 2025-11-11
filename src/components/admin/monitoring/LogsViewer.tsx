import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Server, Search, Filter, Download, RefreshCw, AlertCircle, Info, AlertTriangle, Bug, Play, Pause } from 'lucide-react';
import { structuredLogger, LogLevel, LogEntry } from '@/lib/monitoring/StructuredLogger';
import { cn } from '@/lib/utils';

export function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousLogsLengthRef = useRef(0);

  useEffect(() => {
    const updateLogs = async () => {
      const allLogs = await structuredLogger.getLogs();
      const newCount = allLogs.length - previousLogsLengthRef.current;
      
      if (newCount > 0 && previousLogsLengthRef.current > 0) {
        setNewLogsCount(prev => prev + newCount);
      }
      
      previousLogsLengthRef.current = allLogs.length;
      setLogs(allLogs);
      
      // Auto-scroll to bottom if auto-refresh is on
      if (autoRefresh && scrollRef.current) {
        setTimeout(() => {
          const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }, 100);
      }
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 2000); // Refresh every 2 seconds when live
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(updateLogs, 10000); // Refresh every 10 seconds when paused
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    let filtered = [...logs];

    // Filter by level
    if (levelFilter !== 'all') {
      const levelMap: Record<string, LogLevel> = {
        'error': LogLevel.ERROR,
        'warn': LogLevel.WARN,
        'info': LogLevel.INFO,
        'debug': LogLevel.DEBUG,
        'security': LogLevel.CRITICAL, // Map security to CRITICAL
      };
      filtered = filtered.filter(log => log.level === levelMap[levelFilter]);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(query) ||
          log.context?.componentName?.toLowerCase().includes(query) ||
          log.context?.operationName?.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered.reverse()); // Show newest first
  }, [logs, searchQuery, levelFilter]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return 'destructive' as const;
      case LogLevel.WARN:
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    // Since there's no clearLogs method, just clear the local state
    setLogs([]);
    setFilteredLogs([]);
    setNewLogsCount(0);
    previousLogsLengthRef.current = 0;
  };

  const clearNewLogsIndicator = () => {
    setNewLogsCount(0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className={cn("h-5 w-5", autoRefresh && "animate-pulse")} />
              System Logs
              <Badge variant="secondary">{filteredLogs.length}</Badge>
              {newLogsCount > 0 && (
                <Badge variant="default" className="ml-2 animate-pulse">
                  +{newLogsCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time structured application logs with filtering
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="logs-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="logs-auto-refresh" className="text-sm cursor-pointer">
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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warn">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Entries */}
        <ScrollArea className="h-[600px] rounded-lg border" ref={scrollRef} onClick={clearNewLogsIndicator}>
          <div className="p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No logs match your filters</p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div
                  key={`${log.timestamp}-${idx}`}
                  className={cn(
                    "p-3 border rounded-lg hover:bg-accent/5 transition-all font-mono text-xs",
                    idx < newLogsCount && "animate-in fade-in-50 slide-in-from-top-2 border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelBadge(log.level)} className="text-xs">
                          {LogLevel[log.level]}
                        </Badge>
                        {log.context?.componentName && (
                          <Badge variant="outline" className="text-xs">
                            {log.context.componentName}
                          </Badge>
                        )}
                        {log.context?.operationName && (
                          <Badge variant="outline" className="text-xs">
                            {log.context.operationName}
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-xs ml-auto">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{log.message}</p>
                      {log.context?.metadata && Object.keys(log.context.metadata).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-muted/50 rounded overflow-x-auto">
                            {JSON.stringify(log.context.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.error?.stack && (
                        <details className="text-xs text-muted-foreground mt-2">
                          <summary className="cursor-pointer hover:text-foreground">
                            View stack trace
                          </summary>
                          <pre className="mt-2 p-2 bg-muted/50 rounded overflow-x-auto">
                            {log.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
