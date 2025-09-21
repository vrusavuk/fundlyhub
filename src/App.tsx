import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SearchProvider } from "@/contexts/SearchContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateFundraiser from "./pages/CreateFundraiser";
import FundraiserDetail from "./pages/FundraiserDetail";
import AllCampaigns from "./pages/AllCampaigns";
import FundlyPay from "./pages/FundlyPay";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SearchProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/campaigns" element={<AllCampaigns />} />
              <Route path="/fundlypay" element={<FundlyPay />} />
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateFundraiser />
                </ProtectedRoute>
              } />
              <Route path="/fundraiser/:slug" element={<FundraiserDetail />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalSearchModal />
          </SearchProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
