import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eventSpecification, EventType } from "@/data/event-specification";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/docs/CodeBlock";

export const EventsExplorer = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventType>("user.registered");

  const channels = Object.keys(eventSpecification.channels) as EventType[];
  const selectedMessage = eventSpecification.components.messages[
    eventSpecification.channels[selectedEvent].subscribe.message.$ref.split('/').pop() as keyof typeof eventSpecification.components.messages
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Event Explorer</h1>
        <p className="text-xl text-muted-foreground">
          Interactive browser for all domain events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event Type</CardTitle>
          <CardDescription>
            Choose an event to view its schema, payload structure, and examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={(value) => setSelectedEvent(value as EventType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">User Events</div>
              {channels.filter(c => c.startsWith('user.')).map((channel) => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Campaign Events</div>
              {channels.filter(c => c.startsWith('campaign.')).map((channel) => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Donation Events</div>
              {channels.filter(c => c.startsWith('donation.')).map((channel) => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Organization Events</div>
              {channels.filter(c => c.startsWith('organization.')).map((channel) => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Admin Events</div>
              {channels.filter(c => c.startsWith('admin.')).map((channel) => (
                <SelectItem key={channel} value={channel}>{channel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedMessage.title}</CardTitle>
              <CardDescription className="mt-1">{selectedMessage.summary}</CardDescription>
            </div>
            <Badge className="font-mono">{selectedEvent}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schema">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="example">Example</TabsTrigger>
              <TabsTrigger value="code">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="schema" className="mt-4">
              <CodeBlock
                language="json"
                code={JSON.stringify(selectedMessage.payload, null, 2)}
              />
            </TabsContent>
            <TabsContent value="example" className="mt-4">
              {'examples' in selectedMessage && selectedMessage.examples?.[0] ? (
                <CodeBlock
                  language="json"
                  code={JSON.stringify(selectedMessage.examples[0].payload, null, 2)}
                />
              ) : (
                <p className="text-muted-foreground text-sm">No example available for this event</p>
              )}
            </TabsContent>
            <TabsContent value="code" className="mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Publishing Event</h4>
                  <CodeBlock
                    language="typescript"
                    code={`import { globalEventBus, create${selectedMessage.name} } from '@/lib/events';

const event = create${selectedMessage.name}({
  // payload properties here
}, correlationId);

await globalEventBus.publish(event);`}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Subscribing to Event</h4>
                  <CodeBlock
                    language="typescript"
                    code={`import { globalEventBus, ${selectedMessage.name} } from '@/lib/events';

const unsubscribe = globalEventBus.subscribe<${selectedMessage.name}>(
  '${selectedEvent}',
  {
    eventType: '${selectedEvent}',
    async handle(event) {
      console.log('Event received:', event);
      // Handle event logic
    }
  }
);`}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsExplorer;
