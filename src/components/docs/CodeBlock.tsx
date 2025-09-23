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
    <div className="relative group">
      <div className="bg-muted border border-border rounded-lg overflow-hidden">
        {title && (
          <div className="px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
        )}
        <div className="relative">
          <pre className="p-4 overflow-x-auto text-sm">
            <code className={`language-${language}`}>{code}</code>
          </pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}