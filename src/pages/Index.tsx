import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HeroRings from "@/components/HeroRings";
import { useIssues } from "@/hooks/use-issues";
import { ArrowRight } from "lucide-react";
import CommunityCTA from "@/components/CommunityCTA";
import SiteFooter from "@/components/SiteFooter";

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[100svh] flex items-center">
      <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
        <div className="flex flex-col items-center text-center gap-4 md:gap-6">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Unified Campus Platform for
            <br />
            Students & Admins
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground/90">
            Community-driven, student‑first, and privacy‑friendly.
          </p>

          <div className="mt-2 md:mt-4 flex gap-3">
            <a href="#submit">
              <Button size="lg" className="group rounded-full h-12 px-7 bg-black text-white hover:bg-orange-500 tracking-wide transition-colors uppercase font-medium text-[13px]">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
           
          </div>
        </div>
      </div>
      {/* Bottom blend gradient to transition into page background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent via-stone-50/40 to-stone-50"
        aria-hidden
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

  // Count-up number that "spins" while animating and then stops at final value
  function CountUpNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const [spinning, setSpinning] = useState(true);

    useEffect(() => {
      let raf: number;
      const start = performance.now();
      setSpinning(true);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          setSpinning(false);
        }
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return (
      <span className={`inline-block ${spinning ? "animate-spin" : ""}`} style={{ animationDuration: "1.1s" }}>
        {display.toLocaleString()}
      </span>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
      {items.map((i) => (
        <Card key={i.label} className="rounded-2xl border bg-white">
          <CardContent className="py-8 text-center">
            <div className="text-3xl md:text-4xl font-semibold text-orange-500">
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
  const { stats } = useIssues();

  return (
    <div className="min-h-screen bg-stone-50 relative">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-black text-white rounded px-3 py-2">Skip to content</a>
      <Navbar />

      <main id="main">
        {/* Hero */}
        <div className="relative min-h-[100svh]">
          <HeroRings />
          <Hero />
        </div>

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
            <a href="#submit">
              <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-orange-500 tracking-wide transition-colors uppercase font-medium text-[13px]">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature section removed per request */}
      
        {/* Community */}
        <CommunityCTA />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
