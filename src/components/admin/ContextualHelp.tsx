import { useState } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClasses } from '@/lib/design/typography';

interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  links?: Array<{
    label: string;
    url: string;
  }>;
  shortcuts?: Array<{
    key: string;
    description: string;
  }>;
}

interface ContextualHelpProps {
  content: HelpContent;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'tooltip' | 'popover';
  className?: string;
}

export function ContextualHelp({
  content,
  placement = 'top',
  size = 'md',
  variant = 'tooltip',
  className
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const HelpIcon = (
    <HelpCircle className={cn(
      iconSizes[size],
      "text-muted-foreground hover:text-primary transition-colors cursor-help",
      className
    )} />
  );

  if (variant === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-muted/50">
              {HelpIcon}
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side={placement} 
            className="max-w-xs shadow-elevated bg-background/95 backdrop-blur-sm border-border"
          >
            <div className={getSpacingClasses('content', 'sm')}>
              <p className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                {content.description}
              </p>
              
              {content.tips && content.tips.length > 0 && (
                <div className="mt-2">
                  <p className={cn(
                    getTypographyClasses('caption', 'sm'),
                    "font-semibold text-primary mb-1"
                  )}>
                    Tips:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {content.tips.map((tip, index) => (
                      <li key={index} className={getTypographyClasses('caption', 'sm', 'text-muted-foreground')}>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-muted/50">
          {HelpIcon}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        side={placement} 
        className="w-80 shadow-elevated bg-background/95 backdrop-blur-sm border-border"
        align="start"
      >
        <div className={getSpacingClasses('content', 'md')}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className={getTypographyClasses('heading', 'sm', 'text-foreground')}>
              {content.title}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted/50"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Description */}
          <p className={getTypographyClasses('body', 'sm', 'text-muted-foreground')}>
            {content.description}
          </p>

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div>
              <h5 className={cn(
                getTypographyClasses('caption', 'md'),
                "font-semibold text-primary mb-2"
              )}>
                💡 Tips
              </h5>
              <ul className="space-y-1">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary text-xs mt-1">•</span>
                    <span className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          {content.shortcuts && content.shortcuts.length > 0 && (
            <div>
              <h5 className={cn(
                getTypographyClasses('caption', 'md'),
                "font-semibold text-primary mb-2"
              )}>
                ⌨️ Shortcuts
              </h5>
              <div className="space-y-2">
                {content.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={getTypographyClasses('body', 'sm', 'text-foreground')}>
                      {shortcut.description}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {content.links && content.links.length > 0 && (
            <div>
              <h5 className={cn(
                getTypographyClasses('caption', 'md'),
                "font-semibold text-primary mb-2"
              )}>
                📖 Learn More
              </h5>
              <div className="space-y-1">
                {content.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Predefined help content for common admin sections
export const adminHelpContent = {
  campaigns: {
    title: "Campaign Management",
    description: "Manage and moderate fundraising campaigns on the platform.",
    tips: [
      "Use filters to quickly find specific campaigns",
      "Bulk actions can save time when managing multiple campaigns",
      "Check campaign details before approving or rejecting"
    ],
    shortcuts: [
      { key: "g c", description: "Navigate to campaigns" },
      { key: "/", description: "Focus search" },
      { key: "r", description: "Refresh data" }
    ]
  },
  users: {
    title: "User Management", 
    description: "View and manage user accounts, roles, and permissions.",
    tips: [
      "Always provide a reason when suspending users",
      "Check user activity before taking action",
      "Use role filters to manage specific user groups"
    ],
    shortcuts: [
      { key: "g u", description: "Navigate to users" },
      { key: "/", description: "Focus search" },
      { key: "?", description: "Show all shortcuts" }
    ]
  },
  dashboard: {
    title: "Admin Dashboard",
    description: "Overview of platform metrics and system health.",
    tips: [
      "Check system health regularly",
      "Monitor pending reviews for quick action",
      "Use quick actions for common tasks"
    ],
    shortcuts: [
      { key: "g d", description: "Navigate to dashboard" },
      { key: "cmd+k", description: "Open command palette" }
    ]
  }
} as const;