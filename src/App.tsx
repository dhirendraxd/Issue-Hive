import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import PortalErrorBoundary from "./components/PortalErrorBoundary";

// Lazy-load heavy pages for better initial load performance
const About = lazy(() => import("./pages/About"));
const Issues = lazy(() => import("./pages/Issues"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RaiseIssue = lazy(() => import("./pages/RaiseIssue"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - increased for better caching
      gcTime: 1000 * 60 * 30, // 30 minutes - keep data longer
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Disable refetch on reconnect for speed
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading fallback component for code-split routes
const PageLoader = () => (
  <div className="min-h-screen bg-stone-50 flex items-center justify-center animate-in fade-in duration-300">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <PortalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/raise-issue" element={<RaiseIssue />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/u/:uid" element={<UserProfile />} />
              <Route path="/profile/:uid" element={<UserProfile />} />
              <Route path="/profile/:uid/edit" element={<EditProfile />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </PortalErrorBoundary>
);

export default App;
