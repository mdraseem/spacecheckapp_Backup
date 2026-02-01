'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle, Mail, MessageSquare, User, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setSuccess(true)
      setFormData({ name: '', email: '', subject: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-secondary hover:text-secondary/80 mb-8 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Contact Information</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-1">Email</h3>
                  <p className="text-gray-600">support@spacecheck.app</p>
                  <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-1">Support</h3>
                  <p className="text-gray-600">For technical issues</p>
                  <Link href="/dashboard" className="text-sm text-secondary hover:underline mt-1 inline-block">
                    Login to Dashboard →
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10">
              <h3 className="font-bold text-primary mb-2">Quick Response Time</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our team typically responds to inquiries within 24 hours during business days.
                For urgent technical issues, please include "URGENT" in your subject line.
              </p>
              <p className="text-xs text-gray-500">
                Monday - Friday, 9:00 AM - 6:00 PM EST
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-2">Message Sent!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for reaching out. We'll get back to you shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-secondary hover:underline text-sm font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-primary mb-6">Send us a Message</h2>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-primary mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-primary mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-primary mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-primary mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-secondary text-white py-4 rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our{' '}
                  <Link href="/privacy" className="text-secondary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
