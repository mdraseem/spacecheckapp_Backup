'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Calendar, Shield, Loader2, Store } from 'lucide-react'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { dict } = useDashboardLanguage()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [hasShopifyStore, setHasShopifyStore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const billingSource = profile?.billing_source || 'stripe'
  const isShopifyBilled = billingSource === 'shopify'

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch subscription profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        // Check if user has a connected Shopify store
        const { data: storeData } = await supabase
          .from('shopify_stores')
          .select('shop_domain')
          .eq('user_id', user.id)
          .single()

        setHasShopifyStore(!!storeData)
      }

      setLoading(false)
    }
    fetchUserAndProfile()
  }, [])

  const handleUpgrade = async () => {
    setLoadingPortal(true)
    try {
      // If user has a Shopify store connected, use Shopify billing
      if (hasShopifyStore) {
        const response = await fetch('/api/shopify/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create Shopify subscription')
        }

        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl
          return
        }
      }

      // Otherwise, use Stripe checkout
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Upgrade error:', error)
      alert(error.message || 'Failed to start upgrade')
    } finally {
      setLoadingPortal(false)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      if (isShopifyBilled) {
        // Shopify-billed users manage subscription in Shopify admin
        // Check the connected store domain to build the URL
        const supabase = createClient()
        const { data: store } = await supabase
          .from('shopify_stores')
          .select('shop_domain')
          .eq('user_id', user.id)
          .single()

        if (store?.shop_domain) {
          window.open(
            `https://${store.shop_domain}/admin/settings/billing`,
            '_blank'
          )
          setLoadingPortal(false)
          return
        }
      }

      // Stripe-billed users use Stripe portal
      const response = await fetch('/api/create-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Portal error:', error)
      alert(error.message || 'Failed to open billing portal')
    } finally {
      setLoadingPortal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{dict.settings.title}</h1>
        <p className="text-slate-400">{dict.settings.subtitle}</p>
      </div>

      {/* Account Information */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User size={20} className="text-[#00f0ff]" />
          {dict.settings.accountInfo}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Mail size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.email}</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Calendar size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.memberSince}</p>
              <p className="text-white font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Shield size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.userId}</p>
              <p className="text-white font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[#00f0ff]" />
          Subscription & Billing
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">Current Plan</p>
              <p className="text-slate-400 text-sm">Your active subscription plan</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[#00f0ff]/10 text-[#00f0ff] rounded-full text-sm font-bold uppercase">
                {profile?.plan_type || 'Starter'}
              </span>
              {isShopifyBilled && (
                <span className="px-2 py-1 bg-[#96bf48]/10 text-[#96bf48] rounded text-xs font-medium flex items-center gap-1">
                  <Store size={12} />
                  via Shopify
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">Status</p>
              <p className="text-slate-400 text-sm">Subscription status</p>
            </div>
            <div>
              {profile?.subscription_status === 'active' ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                  Active
                </span>
              ) : profile?.subscription_status === 'past_due' ? (
                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
                  Past Due
                </span>
              ) : profile?.subscription_status === 'trialing' ? (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium">
                  Trial Active
                </span>
              ) : profile?.subscription_status === 'canceled' ? (
                <span className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-sm font-medium">
                  Canceled
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-full text-sm font-medium">
                  Free Plan
                </span>
              )}
            </div>
          </div>

          {/* Show Upgrade button for Starter/free plan users */}
          {(!profile?.plan_type || profile?.plan_type === 'starter') && (
            <button
              onClick={handleUpgrade}
              disabled={loadingPortal}
              className="w-full px-4 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingPortal ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                'Upgrade to Growth Plan'
              )}
            </button>
          )}

          {/* Show Manage Subscription for paying users (Stripe or Shopify) */}
          {profile?.plan_type === 'growth' && (profile?.stripe_customer_id || isShopifyBilled) && (
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="w-full px-4 py-3 bg-transparent border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 hover:text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingPortal ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : isShopifyBilled ? (
                <>
                  <Store size={16} />
                  Manage via Shopify
                </>
              ) : (
                'Manage Subscription'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[#00f0ff]" />
          {dict.settings.preferences}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{dict.settings.language}</p>
              <p className="text-slate-400 text-sm">{dict.settings.languageDesc}</p>
            </div>
            <div className="text-slate-300 text-sm">
              {dict.settings.languageNote}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{dict.settings.emailVerified}</p>
              <p className="text-slate-400 text-sm">{dict.settings.emailVerifiedDesc}</p>
            </div>
            <div>
              {user?.email_confirmed_at ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                  {dict.settings.verified}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium">
                  {dict.settings.notVerified}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-lg">
        <p className="text-slate-300 text-sm mb-3">
          {dict.settings.supportNote}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-[#00f0ff] text-[#050a14] px-4 py-2 rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-all text-sm"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
