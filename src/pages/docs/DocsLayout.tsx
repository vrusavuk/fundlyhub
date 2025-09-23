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
      {/* Fixed Sidebar */}
      <DocsSidebar />
      
      {/* Fixed Table of Contents */}
      <TableOfContents />
      
      {/* Main Content with margins for fixed sidebars */}
      <main className="min-h-screen ml-64 mr-56 pt-16 sm:pt-18">
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
    </AppLayout>
  );
}