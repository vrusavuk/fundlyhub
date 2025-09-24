/**
 * Demo page to showcase the refactored search components
 * This page uses the EnhancedSearchProvider to demonstrate the new architecture
 */
import React from 'react';
import { EnhancedSearchProvider } from '@/contexts/EnhancedSearchContext';
import { SearchExample } from '@/components/search/SearchExample';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Navigation } from '@/components/Navigation';

export default function SearchDemo() {
  return (
    <>
      <Navigation />
      <PageContainer>
        <PageHeader
          title="Search Architecture Demo"
          description="Demonstration of the refactored search components with improved architecture"
        />
        
        <EnhancedSearchProvider>
          <SearchExample />
          
          <div className="mt-8 p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold mb-4">Architecture Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Modular Components</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Separated concerns</li>
                  <li>• Reusable components</li>
                  <li>• Better testability</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Enhanced State Management</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• useReducer for complex state</li>
                  <li>• Proper error handling</li>
                  <li>• Performance optimizations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Custom Hooks</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Business logic extraction</li>
                  <li>• Keyboard navigation</li>
                  <li>• Input handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Developer Experience</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Better TypeScript support</li>
                  <li>• Cleaner code structure</li>
                  <li>• Easier maintenance</li>
                </ul>
              </div>
            </div>
          </div>
        </EnhancedSearchProvider>
      </PageContainer>
    </>
  );
}