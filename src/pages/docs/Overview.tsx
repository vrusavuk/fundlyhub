/**
 * API Documentation Overview page
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsOverview() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">FundlyHub API Documentation</h1>
      <p className="text-xl text-muted-foreground mb-6">
        The FundlyHub API provides programmatic access to all platform functionality including fundraisers, 
        user profiles, donations, and search capabilities.
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a RESTful API built on Supabase with automatic caching, retry logic, and comprehensive error handling.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Base URL</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-muted px-2 py-1 rounded break-all">
              https://sgcaqrtnxqhrrqzxmupa.supabase.co/rest/v1
            </code>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Version</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">v1.0.0</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Format</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">JSON</Badge>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">What can you do with the FundlyHub API?</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-3">Fundraising Management</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Create and manage fundraising campaigns</li>
            <li>• Update campaign details and status</li>
            <li>• Track donations and statistics</li>
            <li>• Manage campaign categories</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">User & Social Features</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Manage user profiles and organizations</li>
            <li>• Handle user authentication</li>
            <li>• Access user activity feeds</li>
            <li>• Search across all platform content</li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Core Features</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Automatic Caching</CardTitle>
            <CardDescription className="text-sm">5-minute TTL for improved performance</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Retry Logic</CardTitle>
            <CardDescription className="text-sm">Exponential backoff with 3 retries</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Row Level Security</CardTitle>
            <CardDescription className="text-sm">Built-in data access policies</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Real-time Updates</CardTitle>
            <CardDescription className="text-sm">WebSocket subscriptions available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}