/**
 * API Documentation Overview page
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Activity, Zap } from "lucide-react";

export function DocsOverview() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">FundlyHub Developer Documentation</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Complete documentation for integrating with FundlyHub through REST APIs and Event System
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          FundlyHub provides two integration patterns: a RESTful API for synchronous operations 
          and an Event System for asynchronous notifications of platform state changes.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              REST API
            </CardTitle>
            <CardDescription>Synchronous request-response operations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the REST API to create, read, update, and delete resources like 
              fundraisers, users, and donations. Every operation returns an immediate response.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Event System
            </CardTitle>
            <CardDescription>Asynchronous event-driven notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Subscribe to events to receive notifications when platform state changes. 
              Perfect for webhooks, analytics, auditing, and real-time integrations.
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>How REST API and Events Work Together</AlertTitle>
        <AlertDescription className="mt-2">
          When you perform an action via the REST API (e.g., POST /fundraisers), 
          the API returns the created resource AND publishes a corresponding event 
          (e.g., campaign.created) to the event system. This allows you to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Use REST API for direct operations that need immediate responses</li>
            <li>Subscribe to events for downstream processing, analytics, or integrations</li>
            <li>Build event-driven workflows without polling the API</li>
          </ul>
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

      <h2 className="text-2xl font-bold mb-4">What can you do with FundlyHub?</h2>
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <h2 className="text-2xl font-bold mb-4">REST API vs Event System</h2>
      <div className="border rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Aspect</th>
              <th className="px-4 py-3 text-left">REST API</th>
              <th className="px-4 py-3 text-left">Event System</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-3 font-medium">Communication</td>
              <td className="px-4 py-3">Synchronous (request-response)</td>
              <td className="px-4 py-3">Asynchronous (publish-subscribe)</td>
            </tr>
            <tr className="border-t bg-muted/30">
              <td className="px-4 py-3 font-medium">Use Case</td>
              <td className="px-4 py-3">CRUD operations, queries</td>
              <td className="px-4 py-3">Notifications, audit logs, integrations</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-3 font-medium">Specification</td>
              <td className="px-4 py-3">OpenAPI 3.0</td>
              <td className="px-4 py-3">AsyncAPI 2.6</td>
            </tr>
            <tr className="border-t bg-muted/30">
              <td className="px-4 py-3 font-medium">Best For</td>
              <td className="px-4 py-3">Direct user actions, data fetching</td>
              <td className="px-4 py-3">Background processing, webhooks, analytics</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}