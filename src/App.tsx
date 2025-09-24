import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from '@/components/providers/AppProviders';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateFundraiser from "./pages/CreateFundraiser";
import FundraiserDetail from "./pages/FundraiserDetail";
import AllCampaigns from "./pages/AllCampaigns";
import FundlyGive from "./pages/FundlyGive";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import ErrorRecovery from "./pages/ErrorRecovery";
import { UserProfile } from "./pages/UserProfile";
import { OrganizationProfile } from "./pages/OrganizationProfile";
import ApiDocs from "./pages/ApiDocs";

const App = () => (
  <AppErrorBoundary>
    <AppProviders>
      <PerformanceMonitor />
      <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/campaigns" element={<AllCampaigns />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/fundly-give" element={<FundlyGive />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/organization/:orgId" element={<OrganizationProfile />} />
                    {/* Legacy route redirect for backward compatibility */}
                    <Route path="/fundlypay" element={<Navigate to="/fundly-give" replace />} />
                    <Route path="/create" element={
                      <ProtectedRoute>
                        <CreateFundraiser />
                      </ProtectedRoute>
                    } />
                    <Route path="/fundraiser/:slug" element={<FundraiserDetail />} />
                    <Route path="/docs/*" element={<ApiDocs />} />
                    <Route path="/error-recovery" element={<ErrorRecovery />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </AppProviders>
  </AppErrorBoundary>
);

export default App;