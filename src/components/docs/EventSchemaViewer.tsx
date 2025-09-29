import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface EventSchemaViewerProps {
  eventName: string;
  eventType: string;
  description: string;
  payload: Record<string, any>;
  example?: any;
}

export const EventSchemaViewer = ({
  eventName,
  eventType,
  description,
  payload,
  example,
}: EventSchemaViewerProps) => {
  const renderPropertyType = (prop: any): string => {
    if (prop.type === 'object' && prop.properties) {
      return 'object';
    }
    if (prop.format) {
      return `${prop.type} (${prop.format})`;
    }
    if (prop.enum) {
      return prop.enum.join(' | ');
    }
    return prop.type || 'any';
  };

  const renderProperties = (properties: Record<string, any>, required: string[] = []) => {
    return Object.entries(properties).map(([key, value]: [string, any]) => (
      <TableRow key={key}>
        <TableCell className="font-mono text-sm">{key}</TableCell>
        <TableCell>
          <Badge variant="outline" className="font-mono text-xs">
            {renderPropertyType(value)}
          </Badge>
        </TableCell>
        <TableCell>
          {required.includes(key) && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {value.description || '-'}
        </TableCell>
      </TableRow>
    ));
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="transition-all hover:shadow-md">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="font-mono">{eventType}</Badge>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardTitle className="text-2xl">{eventName}</CardTitle>
                <CardDescription className="mt-2">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Event Payload Structure</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Property</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead className="w-[100px]">Required</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payload.properties && renderProperties(payload.properties, payload.required)}
                  {payload.properties?.payload?.properties && (
                    <>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4} className="font-semibold">
                          Payload Properties
                        </TableCell>
                      </TableRow>
                      {renderProperties(
                        payload.properties.payload.properties,
                        payload.properties.payload.required
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {example && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Example Event</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm">{JSON.stringify(example, null, 2)}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
