import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ParticlesBackground from '@/components/ParticlesBackground';
import Seo from "@/components/Seo";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="Terms of Use"
        description="IssueHive terms of use for student voice, campus voices, and community engagement across Nepalese campuses."
        path="/terms-of-use"
      />
      <ParticlesBackground fullPage hexOpacity={0.08}>
        <Navbar />
        <main className="pt-24 pb-24 px-4 mx-auto max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Use</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-8 space-y-8">
            {/* Introduction */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              <p className="text-stone-700 leading-relaxed">
                Welcome to Issue-Hive. By accessing and using this platform, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our service. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of those modifications.
              </p>
            </section>

            {/* User Responsibilities */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">2. User Responsibilities</h2>
              <p className="text-stone-700 leading-relaxed mb-3">As a user of Issue-Hive, you agree to:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Provide accurate and complete information during registration</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Maintain the confidentiality of your account credentials</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Not impersonate any person or entity</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Not engage in any unlawful or prohibited behavior</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Respect the intellectual property rights of others</span>
                </li>
              </ul>
            </section>

            {/* Content Ownership */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">3. Content Ownership</h2>
              <p className="text-stone-700 leading-relaxed">
                You retain all rights to any content you create and share on Issue-Hive. However, by posting content, you grant us a non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of operating and improving our platform. You remain responsible for all content you post.
              </p>
            </section>

            {/* Prohibited Activities */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">4. Prohibited Activities</h2>
              <p className="text-stone-700 leading-relaxed mb-3">You agree not to:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Engage in harassment, bullying, or abusive behavior</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Post spam, malware, or malicious content</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Attempt to hack, reverse engineer, or compromise security</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Violate any applicable laws or regulations</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Scrape or automate data collection without permission</span>
                </li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">5. Limitation of Liability</h2>
              <p className="text-stone-700 leading-relaxed">
                Issue-Hive is provided "as-is" without warranties of any kind. To the fullest extent permitted by law, Issue-Hive shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use or inability to use the platform or any content therein.
              </p>
            </section>

            {/* Termination */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">6. Account Termination</h2>
              <p className="text-stone-700 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms of Use or for any other reason at our sole discretion. Upon termination, your right to access the platform will immediately cease.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">7. Governing Law</h2>
              <p className="text-stone-700 leading-relaxed">
                These Terms of Use shall be governed by and construed in accordance with the laws of the jurisdiction where Issue-Hive is operated, without regard to its conflict of law principles.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-3 pt-4 border-t border-white/30">
              <h2 className="text-2xl font-bold">8. Contact Us</h2>
              <p className="text-stone-700 leading-relaxed">
                If you have any questions about these Terms of Use, please contact us at <span className="font-semibold text-orange-600">support@issue-hive.com</span>
              </p>
            </section>
          </Card>
        </main>
      </ParticlesBackground>
    </div>
  );
}
