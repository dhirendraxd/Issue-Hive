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

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-50 pointer-events-none" aria-hidden>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Unified Campus Issue Platform
            <br className="hidden md:block" />
            for Students & Admins
          </h1>
          <p className="max-w-2xl text-muted-foreground text-lg">
            Submit, support, and track campus issues—from Wi‑Fi fixes to cafeteria hours. Transparent status, community support.
          </p>
          <div className="flex gap-3">
            <a href="#issues">
              <Button size="lg" className="rounded-full h-12 px-7 bg-black text-white hover:bg-black/90 tracking-wide">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#submit">
              <Button size="lg" variant="outline" className="rounded-full px-6">Submit an Issue</Button>
            </a>
          </div>
        </div>
      </div>
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
      <Navbar />

      {/* Hero */}
      <div className="relative">
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
              <Button className="rounded-full h-12 px-7 bg-black text-white hover:bg-black/90 tracking-wide">
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

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} IssueHive. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#about">About</a>
            <a href="#how">How it works</a>
            <a href="#issues">Issues</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
