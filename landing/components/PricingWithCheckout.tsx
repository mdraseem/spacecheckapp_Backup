'use client'

import { Check, Zap, Unlock, Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import SectionTracker from './SectionTracker'
import { trackLandingEvent, trackConversion } from '@/utils/track'

export default function PricingWithCheckout({ dict }: { dict: any }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const p = dict.pricing

  const handleBuyCredits = async (packIndex: number) => {
    setLoading(`credit-${packIndex}`)
    try {
      trackLandingEvent('pricing_cta_clicked', {
        plan_type: 'credits',
        pack_index: packIndex,
        source: 'pricing_section',
      })

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        trackConversion('signup', 'initiated', { source: 'pricing_credits' })
        router.push('/login')
        return
      }

      const priceIds = [
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_1,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_5,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_20,
      ]

      const priceId = priceIds[packIndex]
      if (!priceId) {
        alert('Credit pack not configured. Set NEXT_PUBLIC_STRIPE_PRICE_CREDIT_* env vars.')
        return
      }

      trackConversion('checkout', 'initiated', {
        plan_type: 'credits',
        price_id: priceId,
      })

      const response = await fetch('/api/create-checkout-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      // Shopify-installed merchants are blocked from Stripe by the API. Redirect
      // them to their Shopify Managed Pricing page instead.
      if (response.status === 403 && data?.code === 'shopify_managed_pricing_required') {
        const shopifyResp = await fetch('/api/shopify/billing', { method: 'POST' })
        const shopifyData = await shopifyResp.json()
        const shopifyUrl = shopifyData?.url || shopifyData?.confirmationUrl
        if (shopifyUrl) {
          window.location.href = shopifyUrl
          return
        }
        throw new Error(
          shopifyData?.error || 'Please manage your subscription from the Shopify admin.'
        )
      }

      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      console.error('Credit checkout error:', error)
      alert(error.message || 'Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  const handleGetStarted = () => {
    trackLandingEvent('pricing_cta_clicked', {
      plan_type: 'unlock',
      source: 'pricing_section',
    })
    router.push('/login')
  }

  const handleContactSales = () => {
    trackLandingEvent('cta_contact_clicked', { source: 'pricing_enterprise' })
    router.push('/contact')
  }

  return (
    <SectionTracker sectionName="pricing" event="pricing_section_viewed">
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">{p.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {/* TIER 1: Generate (Credits) */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-primary">{p.payAsYouGo.name}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">{p.payAsYouGo.desc}</p>

              {/* Credit Packs */}
              <div className="space-y-3 mb-6">
                {p.payAsYouGo.packs.map((pack: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleBuyCredits(i)}
                    disabled={loading !== null}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      i === 1
                        ? 'border-secondary bg-secondary/5 hover:bg-secondary/10'
                        : 'border-gray-200 hover:border-secondary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-base font-bold text-primary">
                        {pack.credits} {pack.credits === 1 ? 'Credit' : 'Credits'}
                      </span>
                      {i === 1 && (
                        <span className="ml-2 text-xs font-bold bg-secondary text-white px-2 py-0.5 rounded-full">
                          {p.mostPopular}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">{pack.perUnit}</p>
                    </div>
                    <div className="text-right">
                      {loading === `credit-${i}` ? (
                        <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{pack.price}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {p.payAsYouGo.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TIER 2: Unlock Per Model — Highlighted */}
            <div className="relative bg-white rounded-2xl p-8 border-2 border-secondary shadow-xl md:scale-105 z-10 flex flex-col">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                {p.unlockLabel || 'Try Before You Buy'}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Unlock className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-primary">{p.unlock.name}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">{p.unlock.desc}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">{p.unlock.price}</span>
                {p.unlock.price !== 'Free' && p.unlock.price !== 'Za Darmo' && (
                  <span className="text-gray-500">{p.perModel}</span>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleGetStarted}
                className="w-full bg-secondary text-white font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 mb-6"
              >
                {p.unlock.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {p.unlock.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TIER 3: Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary">{p.enterprise.name}</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6">{p.enterprise.desc}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">{p.enterprise.price}</span>
              </div>

              {/* CTA */}
              <button
                onClick={handleContactSales}
                className="w-full bg-gray-100 text-primary font-bold py-4 rounded-xl hover:bg-gray-200 transition-all mb-6"
              >
                {p.enterprise.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {p.enterprise.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <Check size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Currency Note */}
          {p.currencyNote && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">{p.currencyNote}</p>
            </div>
          )}
        </div>
      </section>
    </SectionTracker>
  )
}
