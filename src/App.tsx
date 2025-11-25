import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-load heavy pages for better initial load performance
const About = lazy(() => import("./pages/About"));
const Issues = lazy(() => import("./pages/Issues"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RaiseIssue = lazy(() => import("./pages/RaiseIssue"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));

const queryClient = new QueryClient();

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
