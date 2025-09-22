import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SearchProvider } from "@/contexts/SearchContext";
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateFundraiser from "./pages/CreateFundraiser";
import FundraiserDetail from "./pages/FundraiserDetail";
import AllCampaigns from "./pages/AllCampaigns";
import FundlyGive from "./pages/FundlyGive";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import { UserProfile } from "./pages/UserProfile";
import { OrganizationProfile } from "./pages/OrganizationProfile";

// Query client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavigationProvider>
            <SearchProvider>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </SearchProvider>
          </NavigationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
