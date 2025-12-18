import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Megaphone, ThumbsUp, CheckCircle2, UserPlus, MessageSquare, Wrench } from "lucide-react";

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

            {/* How it works (Timeline) */}
            <section className="mx-auto max-w-3xl mt-12 md:mt-16">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-center">How it works</h2>
              <div className="relative mt-8 pl-7">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-orange-300/70 via-orange-200/50 to-transparent" aria-hidden />

                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl glass-card p-5 border border-white/60">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-display font-semibold">Report an issue</h3>
                      <span className="text-[11px] rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 border border-orange-200">Step 1</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Share a campus problem with a clear title, description, and category. Add images if it helps.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative mt-6">
                  <div className="absolute -left-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                    <ThumbsUp className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl glass-card p-5 border border-white/60">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-display font-semibold">Gather support</h3>
                      <span className="text-[11px] rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 border border-orange-200">Step 2</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Students upvote to signal priority. Discussions in comments help add context and ideas.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative mt-6">
                  <div className="absolute -left-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white grid place-items-center shadow-md">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl glass-card p-5 border border-white/60">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-display font-semibold">Track to resolution</h3>
                      <span className="text-[11px] rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 border border-orange-200">Step 3</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Admins move issues through statuses and add progress updates until they’re resolved.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* What you can do as a user */}
            <section className="mx-auto max-w-4xl mt-12 md:mt-16">
              <h3 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-center">As a student, you can</h3>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-white/80 border border-white/60 grid place-items-center text-orange-600">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <p>Create an account and set up your profile</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-white/80 border border-white/60 grid place-items-center text-orange-600">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <p>Raise a new issue with a clear title, description, and category</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-white/80 border border-white/60 grid place-items-center text-orange-600">
                    <ThumbsUp className="h-4 w-4" />
                  </div>
                  <p>Support issues from others with upvotes</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-white/80 border border-white/60 grid place-items-center text-orange-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <p>Join the discussion in comments and follow progress</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-white/80 border border-white/60 grid place-items-center text-orange-600">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <p>Manage your own issues — update visibility, add progress, mark resolved</p>
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
