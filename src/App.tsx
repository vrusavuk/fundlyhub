import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from '@/components/providers/AppProviders';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ResponsiveAdminLayout } from "@/components/admin/mobile";
import { CreateSampleAdmin } from '@/components/admin/CreateSampleAdmin';
import { NavigationProgress } from '@/components/navigation/NavigationProgress';
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// High-traffic routes - imported directly for instant loading
import AllCampaigns from "./pages/AllCampaigns";
import Projects from "./pages/Projects";
import FundlyGive from "./pages/FundlyGive";
import SearchResults from "./pages/SearchResults";
import FundraiserDetail from "./pages/FundraiserDetail";
import ProjectDetailExample from "./pages/ProjectDetailExample";

// Route-specific skeleton loaders
import {
  CampaignsPageSkeleton,
  ProfilePageSkeleton,
  OrganizationPageSkeleton,
  FundlyGivePageSkeleton,
  ApiDocsPageSkeleton,
  CreateFundraiserPageSkeleton,
} from '@/components/skeletons/RouteSkeletons';
import { CampaignPageSkeleton } from '@/components/skeletons/CampaignPageSkeleton';
import { AdminPageSkeleton } from '@/components/skeletons/AdminPageSkeleton';

// Lazy-loaded pages for code splitting
import { 
  LazyCreateFundraiser,
  LazyProjects,
  LazyUserProfile,
  LazyOrganizationProfile,
  LazyApiDocs,
  LazyFundlyGive,
  LazyNotFound,
  LazyErrorRecovery,
  LazyAdminDashboard,
  LazyAnalytics,
  LazyUserManagement,
  LazyCampaignManagement,
  LazyOrganizationManagement,
  LazyRoleManagement,
  LazyAuditLogs,
  LazySystemHealth,
  LazySystemSettings,
  LazyAdminNotificationCenter,
  LazyEventMonitoring,
  LazyDesignSystemDocs,
  LazyFeatureToggles,
} from '@/utils/lazyLoading';

const App = () => (
  <AppErrorBoundary>
    <AppProviders>
      <NavigationProgress />
      <PerformanceMonitor />
      <Routes>
        {/* Critical routes - no lazy loading for instant UX */}
        <Route path="/" element={<Index />} />
        <Route path="/admin-setup" element={<CreateSampleAdmin />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* High-traffic routes - direct imports for instant rendering */}
        <Route path="/campaigns" element={<AllCampaigns />} />
        <Route path="/causes" element={<AllCampaigns />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/fundraiser/:slug" element={<FundraiserDetail />} />
        
        {/* Example: Project Detail Page */}
        <Route path="/project-example" element={<ProjectDetailExample />} />
        
        {/* Medium-traffic routes with appropriate skeletons */}
        <Route path="/fundly-give" element={<FundlyGive />} />
        <Route path="/profile/:userId" element={
          <Suspense fallback={<ProfilePageSkeleton />}>
            <LazyUserProfile />
          </Suspense>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Suspense fallback={<ProfilePageSkeleton />}>
              <LazyUserProfile />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/organization/:orgId" element={
          <Suspense fallback={<OrganizationPageSkeleton />}>
            <LazyOrganizationProfile />
          </Suspense>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <Suspense fallback={<CreateFundraiserPageSkeleton />}>
              <LazyCreateFundraiser />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/docs/*" element={
          <Suspense fallback={<ApiDocsPageSkeleton />}>
            <LazyApiDocs />
          </Suspense>
        } />
        
        {/* Legacy route redirect */}
        <Route path="/fundlypay" element={<Navigate to="/fundly-give" replace />} />
        
        {/* Error recovery - minimal skeleton */}
        <Route path="/error-recovery" element={
          <Suspense fallback={<div className="min-h-screen" />}>
            <LazyErrorRecovery />
          </Suspense>
        } />
        
        {/* Admin Routes - lazy loaded with admin skeleton */}
        <Route path="/admin/*" element={
          <AdminProtectedRoute>
            <ResponsiveAdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyAdminDashboard />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyAnalytics />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyUserManagement />
            </Suspense>
          } />
          <Route path="roles" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyRoleManagement />
            </Suspense>
          } />
          <Route path="audit-logs" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyAuditLogs />
            </Suspense>
          } />
          <Route path="campaigns" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyCampaignManagement />
            </Suspense>
          } />
          <Route path="organizations" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyOrganizationManagement />
            </Suspense>
          } />
          <Route path="notifications" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyAdminNotificationCenter />
            </Suspense>
          } />
          <Route path="system" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazySystemHealth />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazySystemSettings />
            </Suspense>
          } />
          <Route path="events" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyEventMonitoring />
            </Suspense>
          } />
          <Route path="design-system" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyDesignSystemDocs />
            </Suspense>
          } />
          <Route path="feature-toggles" element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <LazyFeatureToggles />
            </Suspense>
          } />
        </Route>
        
        {/* User Notification Center (outside admin) */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen" />}>
              <LazyAdminNotificationCenter />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* 404 - minimal skeleton */}
        <Route path="*" element={
          <Suspense fallback={<div className="min-h-screen" />}>
            <LazyNotFound />
          </Suspense>
        } />
      </Routes>
      <Toaster />
    </AppProviders>
  </AppErrorBoundary>
);

export default App;