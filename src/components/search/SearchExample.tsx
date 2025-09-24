/**
 * Example component demonstrating the new search architecture
 * Shows how to use the refactored search components
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefactoredHeaderSearch } from './RefactoredHeaderSearch';

export function SearchExample() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Refactored Search Demo</h2>
      
      <Button 
        onClick={() => setIsSearchOpen(true)}
        variant="outline"
      >
        Open Refactored Search
      </Button>

      <RefactoredHeaderSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      
      <div className="text-sm text-muted-foreground">
        <p>This demonstrates the new modular search architecture:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Separated concerns with focused components</li>
          <li>Custom hooks for business logic</li>
          <li>Enhanced state management with useReducer</li>
          <li>Better TypeScript types and error handling</li>
          <li>Improved performance with proper memoization</li>
        </ul>
      </div>
    </div>
  );
}