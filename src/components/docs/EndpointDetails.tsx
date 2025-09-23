/**
 * Component for displaying detailed endpoint information
 */
import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/docs/CodeBlock';

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  example?: string;
}

interface RequestBody {
  contentType: string;
  schema?: string;
  example?: string;
}

interface Response {
  status: string;
  description: string;
  example?: string;
  schema?: string;
}

interface EndpointDetailsProps {
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Response[];
  examples?: {
    title: string;
    description?: string;
    code: string;
    language?: string;
  }[];
  children?: ReactNode;
}

export function EndpointDetails({
  parameters = [],
  requestBody,
  responses = [],
  examples = [],
  children
}: EndpointDetailsProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Parameters */}
      {parameters.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Parameters</h4>
          <div className="space-y-2">
            {parameters.map((param, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-primary">{param.name}</code>
                    <Badge variant="outline" className="text-xs">{param.type}</Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {param.description && (
                    <p className="text-sm text-muted-foreground">{param.description}</p>
                  )}
                  {param.example && (
                    <code className="text-xs text-muted-foreground">Example: {param.example}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Body */}
      {requestBody && (
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Request Body</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{requestBody.contentType}</Badge>
            </div>
            {requestBody.example && (
              <CodeBlock 
                code={requestBody.example} 
                language="json"
              />
            )}
          </div>
        </div>
      )}

      {/* Responses */}
      {responses.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Responses</h4>
          <div className="space-y-3">
            {responses.map((response, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={response.status.startsWith('2') ? 'default' : 'destructive'}
                    className="font-mono"
                  >
                    {response.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{response.description}</span>
                </div>
                {response.schema && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-foreground mb-2">Response Schema:</p>
                    <CodeBlock 
                      code={response.schema} 
                      language="json"
                    />
                  </div>
                )}
                {response.example && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-foreground mb-2">Example Response:</p>
                    <CodeBlock 
                      code={response.example} 
                      language="json"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {examples.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-foreground">Examples</h4>
          <div className="space-y-4">
            {examples.map((example, index) => (
              <div key={index}>
                <h5 className="font-medium mb-2 text-foreground">{example.title}</h5>
                {example.description && (
                  <p className="text-sm text-muted-foreground mb-3">{example.description}</p>
                )}
                <CodeBlock 
                  code={example.code} 
                  language={example.language || 'javascript'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom content */}
      {children}
    </div>
  );
}