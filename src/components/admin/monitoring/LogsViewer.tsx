import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Search, Filter, Download, RefreshCw, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react';
import { structuredLogger, LogLevel, LogEntry } from '@/lib/monitoring/StructuredLogger';

export function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateLogs = async () => {
      const allLogs = await structuredLogger.getLogs();
      setLogs(allLogs);
    };

    updateLogs();

    if (autoRefresh) {
      const interval = setInterval(updateLogs, 3000); // Refresh every 3 seconds
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
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Logs
              <Badge variant="secondary">{filteredLogs.length}</Badge>
            </CardTitle>
            <CardDescription>
              Structured application logs with filtering and search
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-primary/10' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
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
        <ScrollArea className="h-[600px] rounded-lg border">
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
                  className="p-3 border rounded-lg hover:bg-accent/5 transition-colors font-mono text-xs"
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
