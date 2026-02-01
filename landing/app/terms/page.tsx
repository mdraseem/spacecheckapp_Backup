import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-primary mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> February 1, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using SpaceCheck ("Service"), you agree to be bound by these Terms of Service.
              If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SpaceCheck provides AI-powered 3D model generation and augmented reality (AR) visualization tools
              for furniture retailers. The Service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>AI-based conversion of 2D product images to 3D models</li>
              <li>Generation of AR-compatible files (GLB and USDZ formats)</li>
              <li>QR code poster generation for in-store displays</li>
              <li>Web-based AR viewer for customer visualization</li>
              <li>Analytics tracking for AR interactions</li>
              <li>HTML embed codes for e-commerce integration</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Upload content you don't own or have rights to use</li>
              <li>Generate models for illegal, harmful, or inappropriate content</li>
              <li>Attempt to reverse-engineer, decompile, or hack the Service</li>
              <li>Use the Service to spam, distribute malware, or harm others</li>
              <li>Exceed rate limits or abuse the API</li>
              <li>Resell or redistribute generated models without proper licensing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Your Content:</strong> You retain all rights to images you upload. By using the Service,
              you grant us a license to process your images solely for the purpose of generating 3D models.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Generated Models:</strong> You own the 3D models generated from your images. SpaceCheck
              retains no ownership rights to generated models.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Our Platform:</strong> The SpaceCheck platform, software, and all related technology
              remain our intellectual property.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">6. Data and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We collect and process data as described in our{' '}
              <Link href="/privacy" className="text-secondary hover:underline">
                Privacy Policy
              </Link>
              . By using the Service, you consent to such processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">7. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive for 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to
              modify, suspend, or discontinue the Service at any time without notice. We are not liable for
              any damages resulting from service interruptions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">8. Payment and Billing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Free Tier:</strong> Subject to usage limits specified in your plan.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Paid Plans:</strong> Billed monthly or annually. Prices are in USD. You authorize
              us to charge your payment method. Refunds are provided at our discretion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues
              until the end of your billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              SpaceCheck is provided "as is" without warranties of any kind. We are not liable for any
              indirect, incidental, or consequential damages arising from your use of the Service. Our
              total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">10. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for any violation
              of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes via email. Continued use of the Service after changes constitutes acceptance of the
              new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4">12. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms, please contact us.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-all"
            >
              Contact Us
            </Link>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              SpaceCheck Inc. • All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
