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
        {/* Sidebar - Fixed */}
        <DocsSidebar />
        
        {/* Main Content - With margins for fixed sidebars */}
        <div className="flex-1 ml-64 mr-56">
          <main className="max-w-4xl mx-auto p-8 pt-24">
            {children}
          </main>
        </div>
        
        {/* Table of Contents - Fixed */}
        <TableOfContents />
      </div>
    </AppLayout>
  );
}