import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Service Terms & Conditions</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-8 space-y-8">
            {/* Introduction */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">1. Overview</h2>
              <p className="text-stone-700 leading-relaxed">
                Issue-Hive is a collaborative platform designed to help communities identify, discuss, and resolve issues affecting their communities. These Service Terms & Conditions govern your use of our platform and define the relationship between you and Issue-Hive. By using our service, you agree to be bound by these terms.
              </p>
            </section>

            {/* Account & Registration */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">2. Account Creation & Management</h2>
              <p className="text-stone-700 leading-relaxed mb-3">When creating an account on Issue-Hive:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>You must provide accurate and truthful information</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>You are responsible for maintaining account security</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>You agree to keep your password confidential</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>You are responsible for all activities under your account</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>You must be at least 13 years old to use this service</span>
                </li>
              </ul>
            </section>

            {/* Content Guidelines */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">3. Content Guidelines</h2>
              <p className="text-stone-700 leading-relaxed mb-3">All content posted on Issue-Hive must:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Be truthful, accurate, and constructive</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Respect the rights and dignity of others</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Not contain hate speech, discrimination, or harassment</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Not violate intellectual property rights</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Not contain malware, phishing, or malicious code</span>
                </li>
              </ul>
            </section>

            {/* Moderation & Enforcement */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">4. Moderation & Content Removal</h2>
              <p className="text-stone-700 leading-relaxed">
                We reserve the right to remove content that violates these terms or our community guidelines. We may suspend or terminate accounts that repeatedly violate our policies. Content moderation decisions are made at our sole discretion, though we aim to be fair and transparent in our enforcement.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">5. Intellectual Property Rights</h2>
              <p className="text-stone-700 leading-relaxed mb-3">
                <strong>Your Content:</strong> You retain all rights to content you create. By posting on Issue-Hive, you grant us a non-exclusive, royalty-free license to use your content for platform operations.
              </p>
              <p className="text-stone-700 leading-relaxed">
                <strong>Our Content:</strong> All Issue-Hive branding, logos, code, and platform design are owned by Issue-Hive. You may not reproduce, modify, or distribute our intellectual property without permission.
              </p>
            </section>

            {/* Platform Features */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">6. Platform Features & Services</h2>
              <p className="text-stone-700 leading-relaxed mb-3">Issue-Hive provides the following features subject to these terms:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Issue creation and categorization</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Community engagement and voting</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>User profiles and social features</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Analytics and engagement tracking</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Community discussions and comments</span>
                </li>
              </ul>
            </section>

            {/* Service Availability */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">7. Service Availability & Disclaimer</h2>
              <p className="text-stone-700 leading-relaxed">
                Issue-Hive is provided "as-is" without warranties of any kind. We do not guarantee uninterrupted service, error-free operation, or that all issues will be resolved. We may temporarily suspend the platform for maintenance, updates, or security purposes without notice. We are not liable for any damages arising from service interruptions or unavailability.
              </p>
            </section>

            {/* User Conduct */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">8. User Conduct Standards</h2>
              <p className="text-stone-700 leading-relaxed mb-3">Users commit to maintaining a respectful and constructive environment. Prohibited conduct includes:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Harassment, abuse, or threats toward other users</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Spam, advertising, or commercial promotion</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Creating duplicate or misleading accounts</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Attempting to gain unauthorized access</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Manipulating votes or engagement metrics</span>
                </li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">9. Limitation of Liability</h2>
              <p className="text-stone-700 leading-relaxed">
                To the fullest extent permitted by law, Issue-Hive shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of revenue, profits, or data. Our total liability shall not exceed the amount you paid us in the past 12 months, if applicable.
              </p>
            </section>

            {/* Indemnification */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">10. Indemnification</h2>
              <p className="text-stone-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Issue-Hive and its operators from any claims, damages, losses, or expenses arising from your violation of these terms, your use of the platform, or your content.
              </p>
            </section>

            {/* Amendments */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">11. Changes to Terms</h2>
              <p className="text-stone-700 leading-relaxed">
                We may update these terms at any time. Changes will be effective upon posting to the platform. Your continued use after modifications constitute acceptance of the new terms. We will notify you of significant changes via email or platform notification.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-3 pt-4 border-t border-white/30">
              <h2 className="text-2xl font-bold">12. Contact & Support</h2>
              <p className="text-stone-700 leading-relaxed">
                For questions about these terms or to report violations, contact us at <span className="font-semibold text-orange-600">legal@issue-hive.com</span>
              </p>
            </section>
          </Card>
        </main>
      </ParticlesBackground>
    </div>
  );
}
