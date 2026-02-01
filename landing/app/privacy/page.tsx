import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 mb-8 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-primary mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> February 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              SpaceCheck Inc. ("we", "our", or "us") respects your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-bold text-primary mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, password (hashed)</li>
              <li><strong>Product Images:</strong> Photos you upload for 3D model generation</li>
              <li><strong>Product Data:</strong> Product names, dimensions, and metadata</li>
              <li><strong>Payment Information:</strong> Processed by our payment provider (Stripe) - we do not store full credit card details</li>
            </ul>

            <h3 className="text-xl font-bold text-primary mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>Analytics Data:</strong> AR viewer interactions, QR code scans, model views</li>
              <li><strong>IP Address:</strong> For security and rate limiting</li>
              <li><strong>Cookies:</strong> Authentication tokens, session data, preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use collected information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Process your images and generate 3D models</li>
              <li>Manage your account and authentication</li>
              <li>Process payments and billing</li>
              <li>Send service updates and important notifications</li>
              <li>Provide customer support</li>
              <li>Analyze usage patterns to improve the Service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Storage:</strong> Your data is stored on secure servers provided by Supabase (PostgreSQL database)
              and cloud storage providers. Images and 3D models are stored in encrypted cloud storage.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Security Measures:</strong> We implement industry-standard security measures including
              encryption in transit (HTTPS/TLS), encrypted storage, secure authentication, and regular security audits.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Data Retention:</strong> We retain your data for as long as your account is active.
              After account deletion, data is permanently removed within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do NOT sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Supabase (database), Replicate/Modal (AI processing), Vercel (hosting), Stripe (payments)</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Essential Cookies:</strong> Authentication and session management</li>
              <li><strong>Analytics Cookies:</strong> Understanding how users interact with AR features</li>
              <li><strong>Preference Cookies:</strong> Language selection, UI preferences</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookies through your browser settings, but some features may not work properly
              without essential cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your generated models</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please{' '}
              <Link href="/contact" className="text-secondary hover:underline">
                contact us
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service integrates with third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Replicate/Modal:</strong> AI model processing</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and CDN</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect
              information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">11. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 leading-relaxed">
              California residents have additional rights under the California Consumer Privacy Act (CCPA),
              including the right to know what personal information is collected, to delete personal information,
              and to opt-out of the sale of personal information. We do not sell personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">12. GDPR Compliance (EU Users)</h2>
            <p className="text-gray-700 leading-relaxed">
              If you are in the European Economic Area (EEA), you have rights under the General Data Protection
              Regulation (GDPR), including rights to access, rectification, erasure, restriction of processing,
              data portability, and objection. Our lawful basis for processing is your consent and contractual
              necessity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">13. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the "Last Updated" date. You are
              advised to review this Privacy Policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">14. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this Privacy Policy, please contact us.
            </p>
            <div className="mt-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link href="/terms" className="text-secondary hover:underline mr-8">
              Terms of Service
            </Link>
            <Link href="/" className="text-secondary hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
