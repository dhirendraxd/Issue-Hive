import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";
import { Megaphone, ThumbsUp, CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="relative px-4 md:px-6 pt-32 pb-24">
        {/* Background decorative layers for About page */}
        <HiveHexParticles className="absolute inset-0 z-0 pointer-events-none" />
        <CommunityNodes className="absolute inset-0 z-0 pointer-events-none" />
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">About IssueHive</h1>
          <p className="mt-4 text-muted-foreground">
            IssueHive is a student‑first platform to surface campus problems, rally support, and work with admins
            to resolve them—openly and transparently.
          </p>
        </section>

        <section className="mx-auto max-w-5xl mt-12 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
            <h3 className="text-lg font-semibold">Student‑first</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for students to raise their voice safely and effectively, with simple tools that respect privacy.
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
            <h3 className="text-lg font-semibold">Transparent</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Issues, statuses, and supports are visible so the community can track progress and impact.
            </p>
          </div>
          <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
            <h3 className="text-lg font-semibold">Collaborative</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Students and admins work together—from reporting to resolution—with clear, shared context.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl mt-12 md:mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">How it works</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-500/15 text-orange-600 grid place-items-center">
                  <Megaphone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">Report</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Share a campus issue with a clear description and category.</p>
            </div>
            <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-500/15 text-orange-600 grid place-items-center">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">Support</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Students upvote to show support and prioritize what matters.</p>
            </div>
            <div className="rounded-2xl bg-white/60 backdrop-blur-lg border border-white/40 p-6 text-left">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-orange-500/15 text-orange-600 grid place-items-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">Resolve</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Admins track progress transparently—from received to resolved.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl text-center mt-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Our mission</h2>
          <p className="mt-3 text-muted-foreground">
            Empower campuses to listen better and act faster. Make it easy to share problems, gather support,
            and celebrate solutions.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
