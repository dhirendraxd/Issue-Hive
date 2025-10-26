import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import HeroRings from "@/components/HeroRings";
import { useIssues } from "@/hooks/use-issues";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, type IssueStatus, type IssueCategory } from "@/types/issue";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import IssueList from "@/components/IssueList";
import FilterBar from "@/components/FilterBar";
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
            <a href="#issues">
              <Button size="lg" className="group rounded-full h-12 px-7 bg-black text-white hover:bg-black/90 tracking-wide transition-colors border border-transparent hover:border-orange-500 motion-reduce:transition-none">
                Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
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
    { label: "Total Issues", value: total.toLocaleString() },
    { label: "Open Issues", value: open.toLocaleString() },
    { label: "Total Supports", value: votes.toLocaleString() },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((i) => (
        <Card key={i.label}>
          <CardContent className="py-6">
            <div className="text-2xl font-semibold">{i.value}</div>
            <div className="text-sm text-muted-foreground">{i.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const Index = () => {
  const { data: issues = [], addIssue, upvote, setStatus, stats } = useIssues();
  const [active, setActive] = useState<IssueStatus | "all">("all");
  const [category, setCategory] = useState<IssueCategory | "All">("All");
  const [q, setQ] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const filtered = useMemo(() => {
    return issues
      .filter((i) => (active === "all" ? true : i.status === active))
      .filter((i) => (category === "All" ? true : i.category === category))
      .filter((i) =>
        q.trim()
          ? `${i.title} ${i.description}`.toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [issues, active, category, q]);

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
      <div className="py-4">
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
            <a href="#issues">
              <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-black/90 tracking-wide border border-transparent hover:border-orange-500">
                Start Now
                <ArrowRight className="ml-2 h-4 w-4 text-orange-500" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Issues Feed */}
      <section id="issues" className="mx-auto max-w-6xl px-4 py-10">
        <FilterBar
          active={active}
          onActiveChange={setActive}
          category={category}
          onCategoryChange={setCategory}
          q={q}
          onQChange={setQ}
        />

        <div className="mt-6">
          <IssueList
            issues={filtered}
            onUpvote={(id) => upvote.mutate(id)}
            onStatusChange={(id, status) => setStatus.mutate({ id, status })}
          />
        </div>
      </section>
      
        {/* Community */}
        <CommunityCTA />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
};

export default Index;
