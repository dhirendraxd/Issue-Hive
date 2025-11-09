import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center relative overflow-hidden">
      {/* Comb effect backdrop */}
      <HiveHexParticles className="absolute inset-0 z-0 pointer-events-none" opacity={0.14} />
      <CommunityNodes className="absolute inset-0 z-0 pointer-events-none" />
      <div className="text-center relative z-10">
        <h1 className="text-6xl font-semibold mb-2 tracking-tight">404</h1>
        <p className="text-muted-foreground mb-6">Oops! That page doesn’t exist.</p>
        <a href="/" className="inline-flex items-center rounded-full h-11 px-6 bg-black text-white hover:bg-black/90">
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
