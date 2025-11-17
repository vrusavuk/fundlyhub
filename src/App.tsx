import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from '@/components/providers/AppProviders';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
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

// Admin pages - lazy load remaining
import { 
  LazyCreateFundraiser,
  LazyUserProfile,
  LazyOrganizationProfile,
  LazyApiDocs,
  LazyNotFound,
  LazyErrorRecovery,
} from '@/utils/lazyLoading';

// Admin pages - direct imports for instant navigation
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Analytics } from '@/pages/admin/Analytics';
import { UserManagement } from '@/pages/admin/UserManagement';
import { CampaignManagement } from '@/pages/admin/CampaignManagement';
import { OrganizationManagement } from '@/pages/admin/OrganizationManagement';
import { RoleManagement } from '@/pages/admin/RoleManagement';
import { AuditLogs } from '@/pages/admin/AuditLogs';
import SystemMonitoring from '@/pages/admin/SystemMonitoring';
import { SystemSettings } from '@/pages/admin/SystemSettings';
import NotificationCenter from '@/pages/admin/NotificationCenter';
import EventMonitoring from '@/pages/admin/EventMonitoring';
import { DesignSystemDocs } from '@/pages/admin/DesignSystemDocs';
import FeatureToggles from '@/pages/admin/FeatureToggles';
import { DonationManagement } from '@/pages/admin/DonationManagement';
import DonationDetail from '@/pages/admin/DonationDetail';
import CampaignDetail from '@/pages/admin/CampaignDetail';
import UserDetail from '@/pages/admin/UserDetail';
import OrganizationDetail from '@/pages/admin/OrganizationDetail';
import PayoutManagement from '@/pages/admin/PayoutManagement';

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
        
        {/* Admin Routes - direct imports for instant navigation */}
        <Route path="/admin/*" element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="campaigns" element={<CampaignManagement />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="donations" element={<DonationManagement />} />
          <Route path="donations/:id" element={<DonationDetail />} />
          <Route path="payouts" element={<PayoutManagement />} />
          <Route path="organizations" element={<OrganizationManagement />} />
          <Route path="organizations/:id" element={<OrganizationDetail />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="system" element={<Navigate to="/admin/monitoring" replace />} />
          <Route path="monitoring" element={<SystemMonitoring />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="events" element={<EventMonitoring />} />
          <Route path="design-system" element={<DesignSystemDocs />} />
          <Route path="feature-toggles" element={<FeatureToggles />} />
        </Route>
        
        {/* User Notification Center (outside admin) */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen" />}>
              <NotificationCenter />
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