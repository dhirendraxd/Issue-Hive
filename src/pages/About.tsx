import Navbar from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ISSUEHIVE_CREATOR } from "@/lib/seo";
import { Megaphone, ThumbsUp, CheckCircle2, Eye } from "@/components/icons/IconifyIcons";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="About IssueHive"
        description="IssueHive helps campus communities report concerns, support one another, and transparently follow issue progress from submission to resolution."
        path="/about"
        keywords={[
          "about issuehive",
          "student voice platform",
          "campus issue reporting",
          "transparent issue tracking",
          "campus issue resolution",
        ]}
      />
      <Navbar />
      <main className="scroll-mt-20">
        <ParticlesBackground fullPage hexOpacity={0.10}>
          <div className="px-4 md:px-6 pt-28 pb-24">
            
            {/* Hero - Most Important First */}
            <section className="mx-auto max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold tracking-tight leading-tight">
                About IssueHive
              </h1>
              <p className="mt-6 text-lg text-stone-600 leading-relaxed">
                A clearer way for campus communities to raise concerns, share context, and follow progress.
              </p>
            </section>

            <section className="mx-auto mt-12 max-w-3xl rounded-2xl border border-orange-200/70 bg-white p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold tracking-tight">
                    Transparency from report to resolution
                  </h2>
                  <p className="mt-3 leading-relaxed text-stone-600">
                    Public reports make it easier for the community to see concerns, add context, and
                    follow status and progress updates. Resolution notes help show what changed, while
                    visibility controls let people keep a report private or in draft when appropriate.
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto mt-20 max-w-3xl">
              <h2 className="mb-10 text-2xl font-display font-semibold tracking-tight">How it works</h2>
              
              <div className="space-y-8">
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Megaphone className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Report an issue</h3>
                    <p className="text-stone-600">Describe a concern and choose its category, urgency, and visibility.</p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <ThumbsUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Gather support</h3>
                    <p className="text-stone-600">Community votes and comments add support and context to public reports.</p>
                  </div>
                </div>

                <div className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Track to resolution</h3>
                    <p className="text-stone-600">Follow status changes, progress updates, and resolution details over time.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-3xl border-t border-stone-200 pt-6">
              <p className="text-sm text-stone-500">
                Created by{" "}
                <a
                  href={ISSUEHIVE_CREATOR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-stone-700 underline-offset-4 hover:underline"
                >
                  Dhirendra Singh Dhami
                </a>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/issues">Browse campus issues</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/raise-issue">Report a campus issue</Link>
                </Button>
              </div>
            </section>

          </div>
        </ParticlesBackground>
      </main>
    </div>
  );
}
