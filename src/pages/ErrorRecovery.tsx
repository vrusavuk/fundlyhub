/**
 * Error Recovery page for when the app encounters runtime errors
 * Provides debugging information and recovery options
 */
import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ErrorRecovery() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleClearCache = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Reload the page
    window.location.reload();
  };

  return (
    <PageContainer className="min-h-screen flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Application Error</CardTitle>
          <p className="text-muted-foreground">
            We encountered an error while loading the application. This might be due to a temporary issue or cached data.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
            
            <Button onClick={handleClearCache} variant="outline" className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Clear Cache & Reload
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Troubleshooting Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Try refreshing the page first</li>
              <li>Clear your browser cache if the problem persists</li>
              <li>Check your internet connection</li>
              <li>Try accessing the site in an incognito/private window</li>
            </ul>
          </div>
          
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Recent Fixes Applied:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>✅ Phase 1: Removed performance-draining console.logs</li>
              <li>✅ Phase 2: Consolidated duplicate search contexts</li>
              <li>🔧 Enhanced error handling and fallbacks</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}