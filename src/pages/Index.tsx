import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HeroRings from "@/components/HeroRings";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";
import AmbientDust from "@/components/AmbientDust";
import BubbleParticles from "@/components/BubbleParticles";
import { useIssues } from "@/hooks/use-issues";
import { useIssuesFirebase } from "@/hooks/use-issues-firebase";
import { isFirebaseConfigured } from "@/integrations/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import CommunityCTA from "@/components/CommunityCTA";
import SiteFooter from "@/components/SiteFooter";
import ParticlesBackground from "@/components/ParticlesBackground";

function Hero() {
  const { user } = useAuth();
  
  return (
    <section className="relative overflow-hidden min-h-[100svh] flex items-center">
      <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
        {/* Content wrapper */}
        <div className="flex flex-col items-center text-center gap-4 md:gap-6 relative">
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight leading-tight">
            Unified Campus Platform for
            <br />
            Students & Admins
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground/90">
            Community-driven, student‑first, and privacy‑friendly.
          </p>

          <div className="mt-2 md:mt-4 flex gap-3">
            <Link to={user ? "/raise-issue" : "/auth"}>
              <Button size="lg" className="group rounded-full h-12 px-7 bg-black text-white hover:bg-orange-400/90 tracking-wide transition-colors uppercase font-display font-medium text-[13px]">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Subtle bottom feather: very light inset shadow + mask to soften transition without obvious gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
        aria-hidden
        style={{
          boxShadow: "inset 0 -34px 48px -24px rgba(255,255,255,0.9)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />
    </section>
  );
}

function StatCards({ total, open, votes }: { total: number; open: number; votes: number }) {
  const items = [
    { label: "Total Issues", value: total },
    { label: "Open Issues", value: open },
    { label: "Total Supports", value: votes },
  ];

  // Count animation: quickly 1 -> 100, then settle to actual value (up or down)
  function CountUpNumber({ value, upDuration = 700, settleDuration = 500 }: { value: number; upDuration?: number; settleDuration?: number }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      let raf: number;
      const maxPhase = 100;

      // Phase 1: 1 -> 100 fast
      const start1 = performance.now();
      const step1 = (now: number) => {
        const t = Math.min(1, (now - start1) / upDuration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out
        const current = Math.max(1, Math.round(eased * maxPhase));
        setDisplay(current);
        if (t < 1) {
          raf = requestAnimationFrame(step1);
        } else {
          // Phase 2: 100 -> value
          const start2 = performance.now();
          const from = maxPhase;
          const to = value;
          const delta = to - from;
          const step2 = (now2: number) => {
            const t2 = Math.min(1, (now2 - start2) / settleDuration);
            const eased2 = 1 - Math.pow(1 - t2, 3);
            const current2 = Math.round(from + delta * eased2);
            setDisplay(current2);
            if (t2 < 1) {
              raf = requestAnimationFrame(step2);
            }
          };
          raf = requestAnimationFrame(step2);
        }
      };
      raf = requestAnimationFrame(step1);
      return () => cancelAnimationFrame(raf);
    }, [value, upDuration, settleDuration]);

    return <span className="inline-block">{display.toLocaleString()}</span>;
  }
  return (
    <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
      {items.map((i) => (
        <Card key={i.label} className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all duration-300">
          <CardContent className="py-8 text-center">
            <div className="text-3xl md:text-4xl font-display font-semibold text-orange-500">
              <CountUpNumber value={i.value} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{i.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const Index = () => {
  const local = useIssues();
  const cloud = useIssuesFirebase();
  const stats = isFirebaseConfigured ? cloud.stats : local.stats;

  return (
    <div className="min-h-screen bg-stone-50 relative animate-in fade-in duration-300">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-black text-white rounded px-3 py-2">Skip to content</a>
  <Navbar />

  <main id="main" className="scroll-mt-20">
        {/* Hero */}
        <div className="relative min-h-[100svh]">
          {/* Background decorative layers with softer edges */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)",
            }}
          >
            <HiveHexParticles className="absolute inset-0 pointer-events-none" opacity={0.12} />
            <CommunityNodes className="absolute inset-0 pointer-events-none" />
          </div>
          <HeroRings />
          <AmbientDust className="absolute inset-0 z-0 pointer-events-none" />
          <BubbleParticles className="absolute inset-0 z-0 pointer-events-none" />
          <Hero />
        </div>

      {/* Below-hero content with subtle background layers */}
  <ParticlesBackground longFade hexOpacity={0.16}>
        {/* Stats */}
        <div className="py-8">
          <StatCards total={stats.total} open={stats.open} votes={stats.votes} />
        </div>

        {/* Mid CTA (replaces form section) */}
        <section id="submit" className="px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Voice, Your Campus</h2>
            <p className="mt-2 text-muted-foreground">
              IssueHive helps students surface problems and support solutions. Simple, transparent, and community‑driven.
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/raise-issue">
                <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-orange-400/90 tracking-wide transition-colors uppercase font-medium text-[13px]">
                  Start Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Community */}
        <CommunityCTA />
  </ParticlesBackground>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
