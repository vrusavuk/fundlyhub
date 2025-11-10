import { useState, useEffect } from 'react';
import { AdminPageLayout, PageSection, PageGrid } from '@/components/admin/unified';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { DeadLetterQueueManager } from '@/lib/events/DeadLetterQueueManager';

interface EventRecord {
  event_id: string;
  event_type: string;
  event_data: any;
  occurred_at: string;
  correlation_id?: string;
}

interface ProcessingStatus {
  id: string;
  event_id: string;
  processor_name: string;
  status: string;
  attempt_count: number;
  error_message?: string;
  completed_at?: string;
}

export default function EventMonitoring() {
  const [recentEvents, setRecentEvents] = useState<EventRecord[]>([]);
  const [eventStats, setEventStats] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [deadLetterQueue, setDeadLetterQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const { toast } = useToast();
  const dlqManager = new DeadLetterQueueManager(supabase);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time events
    const subscription = supabase
      .channel('event-monitoring')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_store' }, () => {
        loadRecentEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadRecentEvents(),
      loadEventStats(),
      loadProcessingStatus(),
      loadDeadLetterQueue(),
    ]);
    setLoading(false);
  };

  const loadRecentEvents = async () => {
    const { data, error } = await supabase
      .from('event_store')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading events:', error);
    } else {
      setRecentEvents(data || []);
    }
  };

  const loadEventStats = async () => {
    const { data, error } = await supabase
      .from('event_store')
      .select('event_type, occurred_at')
      .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error loading event stats:', error);
    } else {
      const stats = data?.reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});
      setEventStats({ total: data?.length || 0, byType: stats || {} });
    }
  };

  const loadProcessingStatus = async () => {
    const { data, error } = await supabase
      .from('event_processing_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading processing status:', error);
    } else {
      setProcessingStatus(data || []);
    }
  };

  const loadDeadLetterQueue = async () => {
    const { data, error } = await supabase
      .from('event_dead_letter_queue')
      .select('*')
      .order('first_failed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading dead letter queue:', error);
    } else {
      setDeadLetterQueue(data || []);
    }
  };

  const reprocessSingleEvent = async (dlqId: string) => {
    setReprocessing(true);
    try {
      const success = await dlqManager.reprocessEvent(dlqId);
      
      if (success) {
        toast({
          title: 'Event reprocessed',
          description: 'The event was successfully reprocessed',
        });
        await loadDeadLetterQueue();
      } else {
        toast({
          title: 'Reprocessing failed',
          description: 'The event could not be reprocessed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reprocessing event:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while reprocessing',
        variant: 'destructive',
      });
    } finally {
      setReprocessing(false);
    }
  };

  const reprocessAllEvents = async () => {
    setReprocessing(true);
    try {
      const result = await dlqManager.reprocessAll();
      
      toast({
        title: 'Reprocessing complete',
        description: `Successfully reprocessed ${result.success} events. ${result.failed} failed.`,
      });
      
      await loadDeadLetterQueue();
    } catch (error) {
      console.error('Error reprocessing events:', error);
      toast({
        title: 'Reprocessing failed',
        description: 'Failed to reprocess events',
        variant: 'destructive',
      });
    } finally {
      setReprocessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <AdminPageLayout 
      title="Event Monitoring" 
      description="Monitor and manage event-driven architecture"
    >
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deadLetterQueue.length}</div>
            <p className="text-xs text-muted-foreground">In dead letter queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(eventStats?.byType || {}).length}
            </div>
            <p className="text-xs text-muted-foreground">Unique event types</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Events</TabsTrigger>
          <TabsTrigger value="processing">Processing Status</TabsTrigger>
          <TabsTrigger value="failed">Failed Events</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Last 50 events published to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div 
                    key={event.event_id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{event.event_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.occurred_at), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {event.event_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>Event processing by different processors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processingStatus.map((status) => (
                  <div 
                    key={status.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(status.status)}
                      <div>
                        <div className="font-medium">{status.processor_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Event: {status.event_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={status.status === 'completed' ? 'default' : 'destructive'}>
                        {status.status}
                      </Badge>
                      {status.attempt_count > 1 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {status.attempt_count} attempts
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dead Letter Queue</CardTitle>
                  <CardDescription>Failed events that need attention</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={reprocessAllEvents}
                  disabled={deadLetterQueue.length === 0 || reprocessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-spin' : ''}`} />
                  Reprocess All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deadLetterQueue.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start justify-between p-3 border border-destructive/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <Badge variant="destructive">{item.processor_name}</Badge>
                      </div>
                      <div className="text-sm mb-2">{item.failure_reason}</div>
                      <div className="text-xs text-muted-foreground">
                        Failed {item.failure_count} times • 
                        Last failed: {format(new Date(item.last_failed_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reprocessSingleEvent(item.id)}
                      disabled={reprocessing}
                    >
                      <RefreshCw className={`h-4 w-4 ${reprocessing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                ))}
                {deadLetterQueue.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>No failed events!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Statistics</CardTitle>
              <CardDescription>Event distribution by type (last 24 hours)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(eventStats?.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="font-medium">{type}</span>
                    </div>
                    <Badge>{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
