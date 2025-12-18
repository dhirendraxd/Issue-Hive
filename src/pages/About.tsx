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

            <section className="mx-auto max-w-4xl mt-10">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 border border-white/60 text-stone-700">Student‑first</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 border border-white/60 text-stone-700">Transparent</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 border border-white/60 text-stone-700">Collaborative</span>
              </div>
            </section>

            {/* How it works (Timeline) */}
            <section className="mx-auto max-w-3xl mt-12 md:mt-16">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight text-center">How it works</h2>
              <ol className="relative mt-8 border-l border-stone-200">
                {/* Item 1 */}
                <li className="mb-10 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-8 ring-stone-50 shadow">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <time className="mb-1 block text-xs font-medium text-orange-700">Step 1</time>
                  <h3 className="text-base font-display font-semibold">Report an issue</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Share a campus problem with a clear title, description, and category.</p>
                </li>

                {/* Item 2 */}
                <li className="mb-10 ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-8 ring-stone-50 shadow">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </span>
                  <time className="mb-1 block text-xs font-medium text-orange-700">Step 2</time>
                  <h3 className="text-base font-display font-semibold">Gather support</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Upvotes signal priority; comments add helpful context (and the occasional spicy take).</p>
                </li>

                {/* Item 3 */}
                <li className="ml-6">
                  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white ring-8 ring-stone-50 shadow">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <time className="mb-1 block text-xs font-medium text-orange-700">Step 3</time>
                  <h3 className="text-base font-display font-semibold">Track to resolution</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Admins update status and progress until it’s done. Yes, actually done.</p>
                </li>
              </ol>
              <p className="mt-2 text-center text-xs text-muted-foreground">No capes, just clean timelines.</p>
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
