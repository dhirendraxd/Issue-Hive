import { useEffect, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { collection, getCountFromServer } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";
import { useIssuesFirebase } from "@/hooks/use-issues-firebase";
import { useAuth } from "@/hooks/use-auth";
import { db, isFirebaseConfigured } from "@/integrations/firebase/config";
import { ArrowRight } from "@/components/icons/IconifyIcons";
import { SEO } from "@/lib/seo";
import CommunityCTA from "@/components/CommunityCTA";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load heavy particle/animation components (framer-motion already code-split via vite.config)
// Only load on desktop for better mobile performance
const HeroRings = lazy(() => import("@/components/HeroRings"));
const HiveHexParticles = lazy(() => import("@/components/HiveHexParticles"));
const CommunityNodes = lazy(() => import("@/components/CommunityNodes"));
const AmbientDust = lazy(() => import("@/components/AmbientDust"));
const BubbleParticles = lazy(() => import("@/components/BubbleParticles"));
const ParticlesBackground = lazy(() => import("@/components/ParticlesBackground"));

const HERO_TAGLINES = [
  "Campus voices in Nepal: report campus problems, share campus event posts, and grow community engagement.",
  "Report campus problems, share campus events, and help your community move forward.",
  "Make campus concerns visible and support solutions together.",
  "Share campus issues and help build a more responsive community.",
];

function Hero() {
  const { user } = useAuth();
  const [typedTagline, setTypedTagline] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedTagline(HERO_TAGLINES[0]);
      return;
    }

    let messageIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timeout: number;

    const animate = () => {
      const message = Array.from(HERO_TAGLINES[messageIndex]);
      characterIndex += deleting ? -1 : 1;
      setTypedTagline(message.slice(0, characterIndex).join(""));

      if (!deleting && characterIndex === message.length) {
        deleting = true;
        timeout = window.setTimeout(animate, 2200);
        return;
      }

      if (deleting && characterIndex === 0) {
        deleting = false;
        messageIndex = (messageIndex + 1) % HERO_TAGLINES.length;
      }

      timeout = window.setTimeout(animate, deleting ? 24 : 48);
    };

    timeout = window.setTimeout(animate, 500);
    return () => window.clearTimeout(timeout);
  }, []);
  
  return (
    <section className="relative overflow-hidden min-h-[100svh] flex items-center">
      <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
        {/* Content wrapper */}
        <motion.div 
          className="flex flex-col items-center text-center gap-4 md:gap-6 relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight leading-tight">
            Student Voice Platform for
            <br />
            Campus Issue Reporting
          </h1>
          <p className="flex h-16 max-w-2xl items-center justify-center text-xs leading-5 text-muted-foreground/90 md:text-sm md:leading-6">
            <span aria-hidden="true">{typedTagline}</span>
            <span className="ml-0.5 inline-block h-4 border-l border-orange-500 align-middle motion-safe:animate-pulse" aria-hidden="true" />
          </p>
          <span className="sr-only">{HERO_TAGLINES[0]}</span>

          <div className="mt-2 md:mt-4 flex gap-3">
            <Link to={user ? "/raise-issue" : "/auth"}>
              <Button size="lg" className="group rounded-full h-12 px-7 bg-black text-white hover:bg-orange-400/90 tracking-wide transition-colors uppercase font-display font-medium text-[13px]">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
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

function StatCards({ total, open, users }: { total: number; open: number; users?: number }) {
  const items = [
    { label: "Total Issues", value: total },
    { label: "Open Issues", value: open },
    { label: "Registered Users", value: users },
  ];

  // Count animation: quickly 1 -> 100, then settle to actual value (up or down)
  function CountUpNumber({ value, upDuration = 700, settleDuration = 500 }: { value?: number; upDuration?: number; settleDuration?: number }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      if (value === undefined) return;

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
      {items.map((i, idx) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
        >
          <Card className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all duration-300">
            <CardContent className="py-8 text-center">
              <div className="text-3xl md:text-4xl font-display font-semibold text-orange-500">
                {i.value === undefined ? "—" : <CountUpNumber value={i.value} />}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{i.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

const Index = () => {
  const { stats } = useIssuesFirebase();
  const { data: registeredUsers } = useQuery({
    queryKey: ["registered-user-count"],
    queryFn: async () => {
      if (!db) {
        throw new Error("Firebase is not configured; registered users cannot be counted.");
      }

      try {
        const snapshot = await getCountFromServer(collection(db, "users"));
        return snapshot.data().count;
      } catch (error) {
        console.error("Failed to load registered user count:", error);
        throw error;
      }
    },
    enabled: isFirebaseConfigured && !!db,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-stone-50 relative animate-in fade-in duration-300">
      <Seo
        title="Campus Issue Reporting in Nepal"
        description="IssueHive helps Nepalese campus communities report problems, share context, gather student support, and track progress from report to resolution."
        path="/"
        keywords={[
          "issue reporting nepal",
          "college issue reporting system nepal",
          "report campus problems in Nepal",
          "student voice platform",
          "campus issue tracking",
          "campus issue resolution",
          "college community engagement",
          "student-led campus improvement",
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${SEO.baseUrl}/#application`,
          name: "IssueHive",
          url: `${SEO.baseUrl}/`,
          applicationCategory: "SocialNetworkingApplication",
          operatingSystem: "Web browser",
          description:
            "A student voice platform for Nepalese campuses to report campus problems, gather community support, and track progress and resolutions.",
          inLanguage: "en-NP",
          creator: { "@id": `${SEO.baseUrl}/#creator` },
          areaServed: {
            "@type": "Country",
            name: "Nepal",
          },
          featureList: [
            "Structured campus issue reports with category and urgency",
            "Public, private, and draft issue visibility",
            "Optional anonymous display when submitting an issue",
            "Community upvotes, downvotes, and threaded comments",
            "Progress updates and issue status history",
            "Resolution notes and issue tracking",
            "Community reporting and moderation workflows",
            "User profiles, notifications, and direct messaging",
          ],
          award: "Third place at KIST Hackfest",
          educationalUse: "Semester project",
        }}
      />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-black text-white rounded px-3 py-2">Skip to content</a>
  <Navbar />

  <main id="main" className="scroll-mt-20">
        {/* Hero */}
        <div className="relative min-h-[100svh]">
          {/* Background decorative layers - only on desktop for performance */}
          {!isMobile && (
            <div 
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)",
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)",
              }}
            >
              <Suspense fallback={null}>
                <HiveHexParticles className="absolute inset-0 pointer-events-none" opacity={0.12} />
                <CommunityNodes className="absolute inset-0 pointer-events-none" />
              </Suspense>
            </div>
          )}
          {!isMobile && (
            <Suspense fallback={null}>
              <HeroRings />
              <AmbientDust className="absolute inset-0 z-0 pointer-events-none" />
              <BubbleParticles className="absolute inset-0 z-0 pointer-events-none" />
            </Suspense>
          )}
          <Hero />
        </div>

      {/* Below-hero content with subtle background layers */}
  {!isMobile ? (
    <ParticlesBackground longFade hexOpacity={0.16}>
      {/* Stats */}
      <div className="py-8">
        <StatCards total={stats.total} open={stats.open} users={registeredUsers} />
      </div>

      {/* Mid CTA (replaces form section) */}
      <section id="submit" className="px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Voice, Your Campus</h2>
          <p className="mt-2 text-muted-foreground">
            IssueHive is a college issue reporting system for Nepal built around student voice, campus voices, and community engagement.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/about">
              <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-orange-400/90 tracking-wide transition-colors uppercase font-medium text-[13px]">
                How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community */}
      <CommunityCTA />
    </ParticlesBackground>
  ) : (
    <>
      {/* Stats */}
      <div className="py-8 bg-stone-50">
        <StatCards total={stats.total} open={stats.open} users={registeredUsers} />
      </div>

      {/* Mid CTA (replaces form section) */}
      <section id="submit" className="px-4 py-16 bg-stone-50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Your Voice, Your Campus</h2>
          <p className="mt-2 text-muted-foreground">
            IssueHive is a college issue reporting system for Nepal built around student voice, campus voices, and community engagement.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/about">
              <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-orange-400/90 tracking-wide transition-colors uppercase font-medium text-[13px]">
                How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community */}
      <CommunityCTA />
    </>
  )}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
