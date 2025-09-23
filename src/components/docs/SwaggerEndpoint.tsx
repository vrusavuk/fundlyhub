/**
 * Swagger-style API endpoint display component
 */
import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SwaggerEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  children: ReactNode;
  tags?: string[];
  requiresAuth?: boolean;
  deprecated?: boolean;
}

const methodConfig = {
  GET: {
    variant: 'default' as const,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  POST: {
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  PUT: {
    variant: 'default' as const,
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  DELETE: {
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  PATCH: {
    variant: 'default' as const,
    className: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
};

export function SwaggerEndpoint({
  method,
  path,
  summary,
  description,
  children,
  tags = [],
  requiresAuth = false,
  deprecated = false
}: SwaggerEndpointProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = methodConfig[method];

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      deprecated && "opacity-60"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Badge className={cn("font-mono font-bold min-w-[70px] justify-center", config.className)}>
                {method}
              </Badge>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {path}
                  </code>
                  {requiresAuth && (
                    <Badge variant="outline" className="text-xs">
                      Auth Required
                    </Badge>
                  )}
                  {deprecated && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                      Deprecated
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base font-medium text-left">
                  {summary}
                </CardTitle>
                {description && (
                  <CardDescription className="text-left mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>

              <div className="flex items-center gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 border-t">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}