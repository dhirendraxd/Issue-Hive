import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function About() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="px-4 pt-28 pb-16">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">About IssueHive</h1>
          <p className="mt-4 text-muted-foreground">
            IssueHive is a student‑first platform to surface campus problems, rally support, and work with admins
            to resolve them—openly and transparently.
          </p>
        </section>

        <section className="mx-auto max-w-5xl mt-12 grid gap-6 md:grid-cols-3">
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

        <section className="mx-auto max-w-4xl text-center mt-14">
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
