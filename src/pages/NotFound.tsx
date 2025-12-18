import { useMemo } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bug, Home, Route as RouteIcon, Search, Sparkles } from "lucide-react";

const QUIPS = [
  "404: This page took a gap year.",
  "Well, that escalated quickly.",
  "Plot twist: the page was imaginary.",
  "You had one URL. It wasn’t this one.",
  "Like my GPA after finals — missing.",
  "Bee-lieve it or not, it’s not here.",
  "This link skipped class.",
  "MapQuest couldn’t find this either.",
];

const NotFound = () => {
  const quip = useMemo(() => QUIPS[Math.floor(Math.random() * QUIPS.length)], []);
  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden animate-in fade-in duration-300">
      <ParticlesBackground fullPage hexOpacity={0.12}>
        <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-red-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 min-h-[100svh] max-w-2xl mx-auto px-5 sm:px-8 flex items-center justify-center text-center">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 backdrop-blur-xl px-3 py-1 text-[11px] text-orange-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Page Not Found
            </div>
            <h1 className="mt-4 text-5xl sm:text-6xl font-display font-semibold tracking-tight">Well, that went well.</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">{quip}</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground/80">Either the link is wrong, the page moved, or the internet is feeling quirky today.</p>

            <div className="mt-6 flex flex-col xs:flex-row items-center justify-center gap-2.5">
              <Link to="/">
                <Button className="rounded-full px-5 h-10 bg-black text-white hover:bg-orange-500">
                  <Home className="h-4 w-4 mr-2" /> Take me home
                </Button>
              </Link>
              <Link to="/issues">
                <Button variant="outline" className="rounded-full px-5 h-10">
                  <Search className="h-4 w-4 mr-2" /> Browse issues
                </Button>
              </Link>
              <Link to="/raise-issue">
                <Button variant="ghost" className="rounded-full px-5 h-10">
                  <Bug className="h-4 w-4 mr-2" /> Report this tragedy
                </Button>
              </Link>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <RouteIcon className="h-3.5 w-3.5" />
              If you typed the URL, double‑check the spelling. We’ll pretend we didn’t see it.
            </div>
          </div>
        </div>
      </ParticlesBackground>
    </div>
  );
};

export default NotFound;
