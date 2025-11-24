import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Megaphone, ThumbsUp, CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <Navbar />
      <main className="scroll-mt-20">
        <ParticlesBackground fullPage hexOpacity={0.10}>
          <div className="px-4 md:px-6 pt-28 pb-20">
            <section className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">About IssueHive</h1>
              <p className="mt-4 text-muted-foreground text-base">
                IssueHive is a student‑first platform to surface campus problems, rally support, and work with admins
                to resolve them—openly and transparently.
              </p>
            </section>

            <section className="mx-auto max-w-5xl mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                <h3 className="text-lg font-display font-semibold">Student‑first</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Built for students to raise their voice safely and effectively, with simple tools that respect privacy.
                </p>
              </div>
              <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                <h3 className="text-lg font-display font-semibold">Transparent</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Issues, statuses, and supports are visible so the community can track progress and impact.
                </p>
              </div>
              <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                <h3 className="text-lg font-display font-semibold">Collaborative</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Students and admins work together—from reporting to resolution—with clear, shared context.
                </p>
              </div>
            </section>

            {/* How it works */}
            <section className="mx-auto max-w-5xl mt-12 md:mt-16">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-center">How it works</h2>
              <div className="mt-8 grid gap-8 md:grid-cols-3">
                <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-display font-semibold">Report</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Share a campus issue with a clear description and category.</p>
                </div>
                <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                      <ThumbsUp className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-display font-semibold">Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Students upvote to show support and prioritize what matters.</p>
                </div>
                <div className="rounded-2xl glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 p-6 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-display font-semibold">Resolve</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Admins track progress transparently—from received to resolved.</p>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-4xl text-center mt-16 md:mt-20">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">Our mission</h2>
              <p className="mt-4 text-muted-foreground text-base">
                Empower campuses to listen better and act faster. Make it easy to share problems, gather support,
                and celebrate solutions.
              </p>
            </section>
          </div>
        </ParticlesBackground>
      </main>
      <SiteFooter />
    </div>
  );
}
