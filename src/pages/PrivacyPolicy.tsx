import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>

          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-8 space-y-8">
            {/* Introduction */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">1. Privacy & Data Protection</h2>
              <p className="text-stone-700 leading-relaxed">
                At Issue-Hive, your privacy is our priority. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform. Please read this policy carefully. If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              <p className="text-stone-700 leading-relaxed mb-3">We collect information in the following ways:</p>
              
              <div className="space-y-4 ml-6">
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">Information You Provide</h3>
                  <ul className="space-y-2">
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Registration details (email, display name, profile information)</span>
                    </li>
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Issue descriptions, comments, and engagement metrics</span>
                    </li>
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Social media links and personal website URLs</span>
                    </li>
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Profile pictures</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">Automatically Collected Information</h3>
                  <ul className="space-y-2">
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Device information (browser type, IP address)</span>
                    </li>
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Usage patterns and activity logs</span>
                    </li>
                    <li className="text-stone-700 flex gap-3">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Cookies and similar tracking technologies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <p className="text-stone-700 leading-relaxed mb-3">We use collected information to:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Provide and maintain our platform services</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Authenticate your account and prevent fraud</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Improve and optimize platform functionality</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Send important updates and notifications</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Analyze usage trends and user engagement</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Enforce our Terms of Use and other agreements</span>
                </li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">4. Data Sharing & Disclosure</h2>
              <p className="text-stone-700 leading-relaxed">
                We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances: (1) with your explicit consent, (2) when required by law or legal process, (3) to protect our rights and safety, (4) with service providers who assist in platform operations under strict confidentiality agreements, and (5) in the event of a merger or acquisition.
              </p>
            </section>

            {/* Data Security */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">5. Data Security</h2>
              <p className="text-stone-700 leading-relaxed">
                We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure authentication, and regular security audits. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">6. Your Privacy Rights</h2>
              <p className="text-stone-700 leading-relaxed mb-3">You have the right to:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Access your personal information</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Correct inaccurate data</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Request deletion of your data (where applicable)</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Opt-out of marketing communications</span>
                </li>
                <li className="text-stone-700 flex gap-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Request a data portability report</span>
                </li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">7. Cookies & Tracking</h2>
              <p className="text-stone-700 leading-relaxed">
                We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze platform usage. You can control cookie preferences through your browser settings. Please note that disabling cookies may affect platform functionality.
              </p>
            </section>

            {/* Data Retention */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">8. Data Retention</h2>
              <p className="text-stone-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You may request deletion of your account and associated data at any time, subject to certain legal retention requirements.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">9. Children's Privacy</h2>
              <p className="text-stone-700 leading-relaxed">
                Issue-Hive is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child has provided us with personal information, we will promptly delete such information and terminate the child's account.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-3 pt-4 border-t border-white/30">
              <h2 className="text-2xl font-bold">10. Contact Us</h2>
              <p className="text-stone-700 leading-relaxed">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at <span className="font-semibold text-orange-600">privacy@issue-hive.com</span>
              </p>
            </section>
          </Card>
        </main>
      </ParticlesBackground>
    </div>
  );
}
