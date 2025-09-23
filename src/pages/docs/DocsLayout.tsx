/**
 * Documentation layout wrapper with sidebar and table of contents
 */
import { AppLayout } from "@/components/layout/AppLayout";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { TableOfContents } from "@/components/docs/TableOfContents";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <AppLayout fullWidth>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <DocsSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex ml-64">
          <main className="flex-1 max-w-4xl mx-auto p-8 pt-24">
            {children}
          </main>
          
          {/* Table of Contents */}
          <TableOfContents />
        </div>
      </div>
    </AppLayout>
  );
}