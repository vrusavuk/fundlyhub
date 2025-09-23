/**
 * Documentation layout using standard app layout patterns
 */
import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
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
                  <div className="font-semibold text-sm">API Documentation</div>
                  <div className="text-xs text-muted-foreground">v1.0.0</div>
                </div>
              </div>
              
              <nav className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Getting Started</h4>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/docs" className="text-primary font-medium">Overview</a></li>
                    <li><a href="/docs/quick-start" className="text-muted-foreground hover:text-foreground">Quick Start</a></li>
                    <li><a href="/docs/authentication" className="text-muted-foreground hover:text-foreground">Authentication</a></li>
                    <li><a href="/docs/rate-limits" className="text-muted-foreground hover:text-foreground">Rate Limits</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">API Reference</h4>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/docs/fundraisers" className="text-muted-foreground hover:text-foreground">Fundraisers</a></li>
                    <li><a href="/docs/categories" className="text-muted-foreground hover:text-foreground">Categories</a></li>
                    <li><a href="/docs/profiles" className="text-muted-foreground hover:text-foreground">User Profiles</a></li>
                    <li><a href="/docs/organizations" className="text-muted-foreground hover:text-foreground">Organizations</a></li>
                    <li><a href="/docs/donations" className="text-muted-foreground hover:text-foreground">Donations</a></li>
                    <li><a href="/docs/search" className="text-muted-foreground hover:text-foreground">Search</a></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Examples</h4>
                  <ul className="space-y-1 text-sm">
                    <li><a href="/docs/javascript-examples" className="text-muted-foreground hover:text-foreground">JavaScript</a></li>
                    <li><a href="/docs/curl-examples" className="text-muted-foreground hover:text-foreground">cURL</a></li>
                    <li><a href="/docs/explorer" className="text-muted-foreground hover:text-foreground">API Explorer</a></li>
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
            <div className="bg-background border border-border rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
              <nav className="space-y-1" id="toc-nav">
                <div className="text-xs text-muted-foreground">Table of contents will be generated automatically</div>
              </nav>
            </div>
          </aside>
        </div>
      </PageContainer>
    </AppLayout>
  );
}