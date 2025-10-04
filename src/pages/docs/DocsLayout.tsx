/**
 * Documentation layout using standard app layout patterns
 */
import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { Link, useLocation } from 'react-router-dom';
import { TableOfContents } from '@/components/docs/TableOfContents';

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation();
  
  const isActiveLink = (path: string) => {
    if (path === '/docs') {
      return location.pathname === '/docs' || location.pathname === '/docs/';
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClassName = (path: string) => {
    return isActiveLink(path) 
      ? "text-primary font-medium" 
      : "text-muted-foreground hover:text-foreground";
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 sticky top-20 h-fit">
            <div className="bg-background border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm">Developer Documentation</div>
                  <div className="text-xs text-muted-foreground">v1.0.0</div>
                </div>
              </div>
              
              <nav className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Getting Started</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link to="/docs" className={getLinkClassName('/docs')}>Overview</Link></li>
                    <li><Link to="/docs/quick-start" className={getLinkClassName('/docs/quick-start')}>Quick Start</Link></li>
                    <li><Link to="/docs/authentication" className={getLinkClassName('/docs/authentication')}>Authentication</Link></li>
                    <li><Link to="/docs/rate-limits" className={getLinkClassName('/docs/rate-limits')}>Rate Limits</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">API Reference</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link to="/docs/fundraisers" className={getLinkClassName('/docs/fundraisers')}>Fundraisers</Link></li>
                    <li><Link to="/docs/categories" className={getLinkClassName('/docs/categories')}>Categories</Link></li>
                    <li><Link to="/docs/profiles" className={getLinkClassName('/docs/profiles')}>User Profiles</Link></li>
                    <li><Link to="/docs/organizations" className={getLinkClassName('/docs/organizations')}>Organizations</Link></li>
                    <li><Link to="/docs/donations" className={getLinkClassName('/docs/donations')}>Donations</Link></li>
                    <li><Link to="/docs/search" className={getLinkClassName('/docs/search')}>Search</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Events v2.1.0</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link to="/docs/events" className={getLinkClassName('/docs/events')}>Overview</Link></li>
                    <li><Link to="/docs/events/processors" className={getLinkClassName('/docs/events/processors')}>Event Processors</Link></li>
                    <li><Link to="/docs/events/cqrs" className={getLinkClassName('/docs/events/cqrs')}>CQRS Projections</Link></li>
                    <li><Link to="/docs/events/sagas" className={getLinkClassName('/docs/events/sagas')}>Sagas</Link></li>
                    <li><Link to="/docs/events/user-events" className={getLinkClassName('/docs/events/user-events')}>User Events</Link></li>
                    <li><Link to="/docs/events/campaign-events" className={getLinkClassName('/docs/events/campaign-events')}>Campaign Events</Link></li>
                    <li><Link to="/docs/events/donation-events" className={getLinkClassName('/docs/events/donation-events')}>Donation Events</Link></li>
                    <li><Link to="/docs/events/organization-events" className={getLinkClassName('/docs/events/organization-events')}>Organization Events</Link></li>
                    <li><Link to="/docs/events/admin-events" className={getLinkClassName('/docs/events/admin-events')}>Admin Events</Link></li>
                    <li><Link to="/docs/events/explorer" className={getLinkClassName('/docs/events/explorer')}>Event Explorer</Link></li>
                    <li><Link to="/docs/events/examples" className={getLinkClassName('/docs/events/examples')}>Code Examples</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Examples</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Link to="/docs/javascript-examples" className={getLinkClassName('/docs/javascript-examples')}>JavaScript</Link></li>
                    <li><Link to="/docs/curl-examples" className={getLinkClassName('/docs/curl-examples')}>cURL</Link></li>
                    <li><Link to="/docs/explorer" className={getLinkClassName('/docs/explorer')}>API Explorer</Link></li>
                  </ul>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="max-w-4xl">
              {children}
            </div>
          </main>

          {/* Table of Contents */}
          <aside className="w-56 shrink-0 sticky top-20 h-fit">
            <TableOfContents />
          </aside>
        </div>
      </PageContainer>
    </AppLayout>
  );
}