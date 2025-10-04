/**
 * Mobile documentation navigation with drawer
 */
import { Link, useLocation } from 'react-router-dom';
import { Book, FileText, Zap, Code2, GitBranch } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface MobileDocsNavigationProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileDocsNavigation({ trigger, open, onOpenChange }: MobileDocsNavigationProps) {
  const location = useLocation();
  
  const isActiveLink = (path: string) => {
    if (path === '/docs') {
      return location.pathname === '/docs' || location.pathname === '/docs/';
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClassName = (path: string) => {
    return `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActiveLink(path) 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-foreground hover:bg-muted'
    }`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Book className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-base">Documentation</SheetTitle>
              <div className="text-xs text-muted-foreground">v2.1.0</div>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)] px-4 py-4">
          <Accordion type="multiple" defaultValue={['getting-started', 'api-reference', 'events', 'examples']} className="space-y-2">
            <AccordionItem value="getting-started" className="border-none">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  Getting Started
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <nav className="space-y-1 pl-2">
                  <Link to="/docs" className={getLinkClassName('/docs')} onClick={() => onOpenChange?.(false)}>
                    Overview
                  </Link>
                  <Link to="/docs/quick-start" className={getLinkClassName('/docs/quick-start')} onClick={() => onOpenChange?.(false)}>
                    Quick Start
                  </Link>
                  <Link to="/docs/authentication" className={getLinkClassName('/docs/authentication')} onClick={() => onOpenChange?.(false)}>
                    Authentication
                  </Link>
                  <Link to="/docs/rate-limits" className={getLinkClassName('/docs/rate-limits')} onClick={() => onOpenChange?.(false)}>
                    Rate Limits
                  </Link>
                </nav>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="api-reference" className="border-none">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Code2 className="h-4 w-4" />
                  API Reference
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <nav className="space-y-1 pl-2">
                  <Link to="/docs/fundraisers" className={getLinkClassName('/docs/fundraisers')} onClick={() => onOpenChange?.(false)}>
                    Fundraisers
                  </Link>
                  <Link to="/docs/categories" className={getLinkClassName('/docs/categories')} onClick={() => onOpenChange?.(false)}>
                    Categories
                  </Link>
                  <Link to="/docs/profiles" className={getLinkClassName('/docs/profiles')} onClick={() => onOpenChange?.(false)}>
                    User Profiles
                  </Link>
                  <Link to="/docs/organizations" className={getLinkClassName('/docs/organizations')} onClick={() => onOpenChange?.(false)}>
                    Organizations
                  </Link>
                  <Link to="/docs/donations" className={getLinkClassName('/docs/donations')} onClick={() => onOpenChange?.(false)}>
                    Donations
                  </Link>
                  <Link to="/docs/search" className={getLinkClassName('/docs/search')} onClick={() => onOpenChange?.(false)}>
                    Search
                  </Link>
                </nav>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="events" className="border-none">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GitBranch className="h-4 w-4" />
                  Events v2.1.0
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <nav className="space-y-1 pl-2">
                  <Link to="/docs/events" className={getLinkClassName('/docs/events')} onClick={() => onOpenChange?.(false)}>
                    Overview
                  </Link>
                  <Link to="/docs/events/processors" className={getLinkClassName('/docs/events/processors')} onClick={() => onOpenChange?.(false)}>
                    Event Processors
                  </Link>
                  <Link to="/docs/events/cqrs" className={getLinkClassName('/docs/events/cqrs')} onClick={() => onOpenChange?.(false)}>
                    CQRS Projections
                  </Link>
                  <Link to="/docs/events/sagas" className={getLinkClassName('/docs/events/sagas')} onClick={() => onOpenChange?.(false)}>
                    Sagas
                  </Link>
                  <Link to="/docs/events/user-events" className={getLinkClassName('/docs/events/user-events')} onClick={() => onOpenChange?.(false)}>
                    User Events
                  </Link>
                  <Link to="/docs/events/campaign-events" className={getLinkClassName('/docs/events/campaign-events')} onClick={() => onOpenChange?.(false)}>
                    Campaign Events
                  </Link>
                  <Link to="/docs/events/donation-events" className={getLinkClassName('/docs/events/donation-events')} onClick={() => onOpenChange?.(false)}>
                    Donation Events
                  </Link>
                  <Link to="/docs/events/organization-events" className={getLinkClassName('/docs/events/organization-events')} onClick={() => onOpenChange?.(false)}>
                    Organization Events
                  </Link>
                  <Link to="/docs/events/admin-events" className={getLinkClassName('/docs/events/admin-events')} onClick={() => onOpenChange?.(false)}>
                    Admin Events
                  </Link>
                  <Link to="/docs/events/explorer" className={getLinkClassName('/docs/events/explorer')} onClick={() => onOpenChange?.(false)}>
                    Event Explorer
                  </Link>
                  <Link to="/docs/events/examples" className={getLinkClassName('/docs/events/examples')} onClick={() => onOpenChange?.(false)}>
                    Code Examples
                  </Link>
                </nav>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="examples" className="border-none">
              <AccordionTrigger className="py-3 px-2 hover:no-underline hover:bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4" />
                  Examples
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <nav className="space-y-1 pl-2">
                  <Link to="/docs/javascript-examples" className={getLinkClassName('/docs/javascript-examples')} onClick={() => onOpenChange?.(false)}>
                    JavaScript
                  </Link>
                  <Link to="/docs/curl-examples" className={getLinkClassName('/docs/curl-examples')} onClick={() => onOpenChange?.(false)}>
                    cURL
                  </Link>
                  <Link to="/docs/explorer" className={getLinkClassName('/docs/explorer')} onClick={() => onOpenChange?.(false)}>
                    API Explorer
                  </Link>
                </nav>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
