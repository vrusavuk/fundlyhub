import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from '@/components/providers/AppProviders';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { ResponsiveAdminLayout } from "@/components/admin/mobile";
import { CreateSampleAdmin } from '@/components/admin/CreateSampleAdmin';
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-loaded pages for optimal performance
import { 
  LazyAllCampaigns,
  LazySearchResults,
  LazyFundraiserDetail,
  LazyCreateFundraiser,
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
  LazyWrapper
} from '@/utils/lazyLoading';

const App = () => (
  <AppErrorBoundary>
    <AppProviders>
      <PerformanceMonitor />
      <Routes>
        {/* Critical routes - no lazy loading for instant UX */}
        <Route path="/" element={<Index />} />
        <Route path="/admin-setup" element={<CreateSampleAdmin />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Lazy-loaded main routes */}
        <Route path="/campaigns" element={<LazyWrapper><LazyAllCampaigns /></LazyWrapper>} />
        <Route path="/search" element={<LazyWrapper><LazySearchResults /></LazyWrapper>} />
        <Route path="/fundly-give" element={<LazyWrapper><LazyFundlyGive /></LazyWrapper>} />
        <Route path="/profile/:userId" element={<LazyWrapper><LazyUserProfile /></LazyWrapper>} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <LazyWrapper><LazyUserProfile /></LazyWrapper>
          </ProtectedRoute>
        } />
        <Route path="/organization/:orgId" element={<LazyWrapper><LazyOrganizationProfile /></LazyWrapper>} />
        {/* Legacy route redirect for backward compatibility */}
        <Route path="/fundlypay" element={<Navigate to="/fundly-give" replace />} />
        <Route path="/create" element={
          <ProtectedRoute>
            <LazyWrapper><LazyCreateFundraiser /></LazyWrapper>
          </ProtectedRoute>
        } />
        <Route path="/fundraiser/:slug" element={<LazyWrapper><LazyFundraiserDetail /></LazyWrapper>} />
        <Route path="/docs/*" element={<LazyWrapper><LazyApiDocs /></LazyWrapper>} />
        <Route path="/error-recovery" element={<LazyWrapper><LazyErrorRecovery /></LazyWrapper>} />
        
        {/* Admin Routes - all lazy loaded */}
        <Route path="/admin/*" element={
          <AdminProtectedRoute>
            <ResponsiveAdminLayout />
          </AdminProtectedRoute>
        }>
          <Route index element={<LazyWrapper><LazyAdminDashboard /></LazyWrapper>} />
          <Route path="analytics" element={<LazyWrapper><LazyAnalytics /></LazyWrapper>} />
          <Route path="users" element={<LazyWrapper><LazyUserManagement /></LazyWrapper>} />
          <Route path="roles" element={<LazyWrapper><LazyRoleManagement /></LazyWrapper>} />
          <Route path="audit-logs" element={<LazyWrapper><LazyAuditLogs /></LazyWrapper>} />
          <Route path="campaigns" element={<LazyWrapper><LazyCampaignManagement /></LazyWrapper>} />
          <Route path="organizations" element={<LazyWrapper><LazyOrganizationManagement /></LazyWrapper>} />
          <Route path="notifications" element={<LazyWrapper><LazyAdminNotificationCenter /></LazyWrapper>} />
          <Route path="system" element={<LazyWrapper><LazySystemHealth /></LazyWrapper>} />
          <Route path="settings" element={<LazyWrapper><LazySystemSettings /></LazyWrapper>} />
          <Route path="events" element={<LazyWrapper><LazyEventMonitoring /></LazyWrapper>} />
          <Route path="design-system" element={<LazyWrapper><LazyDesignSystemDocs /></LazyWrapper>} />
        </Route>
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<LazyWrapper><LazyNotFound /></LazyWrapper>} />
      </Routes>
      <Toaster />
      <Sonner />
    </AppProviders>
  </AppErrorBoundary>
);

export default App;