import Navbar from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import Seo from "@/components/Seo";
import { Megaphone, ThumbsUp, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="About IssueHive"
        description="IssueHive is a student voice platform for issue reporting in Nepal. Campus voices report campus problems, rally support, and track resolutions with transparent community engagement."
        path="/about"
        keywords={[
          "about issuehive",
          "student voice platform",
          "campus voices",
          "issue reporting nepal",
          "college issue reporting",
          "community engagement platform",
          "campus problem reporting",
          "nepalese student platform",
          "transparent issue tracking",
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is IssueHive?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "IssueHive is a student voice platform for issue reporting in Nepal. Students report campus problems, gather support, and track resolutions.",
              },
            },
            {
              "@type": "Question",
              name: "How do students report campus problems?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Create a post with a title, description, and category. Campus voices can comment and upvote to drive community engagement.",
              },
            },
            {
              "@type": "Question",
              name: "Does IssueHive support campus events posts?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, campus events posts can be shared to keep the community informed and engaged.",
              },
            },
          ],
        }}
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
                A student platform to report campus issues, rally support, and track resolutions.
              </p>
              <div className="flex flex-wrap gap-2 mt-8">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">Student‑first</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">Transparent</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700">Collaborative</span>
              </div>
            </section>

            {/* How it works - Simple, Clean Layout */}
            <section className="mx-auto max-w-3xl mt-24">
              <h2 className="text-3xl font-display font-semibold tracking-tight mb-12">How it works</h2>
              
              <div className="space-y-8">
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <Megaphone className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Report an issue</h3>
                    <p className="text-stone-600">Share a campus problem with title, description, and category.</p>
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
                    <p className="text-stone-600">Upvotes show priority, comments add context.</p>
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
                    <p className="text-stone-600">Admins update status and progress until it's done.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* What's Next - Modern Card Layout */}
            <section className="mx-auto max-w-3xl mt-24">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl font-display font-semibold tracking-tight">What's next</h2>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 uppercase tracking-wide">Soon</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="group">
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 hover:border-stone-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1.5">Email updates</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">Get notified when your issues are resolved</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 hover:border-stone-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1.5">Student verification</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">Verify with .edu email for a badge</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="mx-auto max-w-3xl mt-24">
              <h2 className="text-2xl font-display font-semibold tracking-tight mb-8">FAQ</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold">What is IssueHive?</h3>
                  <p className="text-sm text-stone-600 mt-1">
                    IssueHive is a student voice platform for issue reporting in Nepal. Campus voices report campus problems, gather support, and track resolutions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">How do students report campus problems?</h3>
                  <p className="text-sm text-stone-600 mt-1">
                    Create a post with a title, description, and category. Community engagement grows through upvotes and comments.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Does IssueHive support campus events posts?</h3>
                  <p className="text-sm text-stone-600 mt-1">
                    Yes. Campus events posts help keep the community informed and active.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </ParticlesBackground>
      </main>
    </div>
  );
}
