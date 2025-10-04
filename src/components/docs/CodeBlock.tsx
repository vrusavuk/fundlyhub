/**
 * Code block component with syntax highlighting
 */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="bg-muted border border-border rounded-lg overflow-hidden">
        {title && (
          <div className="px-3 py-2 sm:px-4 bg-muted/50 border-b border-border">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</span>
          </div>
        )}
        <div className="relative">
          <pre className="p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
            <code className={`language-${language}`}>{code}</code>
          </pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-9 w-9 sm:h-8 sm:w-8"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
    </div>
  );
}