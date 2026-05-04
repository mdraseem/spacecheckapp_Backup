'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Calendar, Shield, Loader2, Store, Zap } from 'lucide-react'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { dict } = useDashboardLanguage()
  const c = dict.credits || {} as any
  const s = dict.settings || {} as any
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [hasShopifyStore, setHasShopifyStore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const creditBalance = profile?.credit_balance ?? 0

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch profile with credit info
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

  const handleBuyCredits = async (packIndex: number) => {
    setLoadingAction(`credit-${packIndex}`)
    try {
      const priceIds = [
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_1,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_5,
        process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_20,
      ]

      const priceId = priceIds[packIndex]
      if (!priceId) {
        alert('Credit pack not configured.')
        return
      }

      const response = await fetch('/api/create-checkout-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      console.error('Credit checkout error:', error)
      alert(error.message || 'Failed to start checkout')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleManageShopifyBilling = async () => {
    setLoadingAction('shopify-billing')
    try {
      const response = await fetch('/api/shopify/billing', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to open Shopify billing')
      const url = data.url || data.confirmationUrl
      if (url) window.location.href = url
    } catch (error: any) {
      console.error('Shopify billing error:', error)
      alert(error.message || 'Failed to open Shopify billing')
    } finally {
      setLoadingAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
      </div>
    )
  }

  const creditPacks = [
    { credits: 1, price: '$7', perUnit: '$7 / model' },
    { credits: 5, price: '$29', perUnit: '$5.80 / model' },
    { credits: 20, price: '$99', perUnit: '$4.95 / model' },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{s.title}</h1>
        <p className="text-slate-400">{s.subtitle}</p>
      </div>

      {/* Account Information */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User size={20} className="text-[#00f0ff]" />
          {s.accountInfo}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Mail size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.email}</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Calendar size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.memberSince}</p>
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
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.userId}</p>
              <p className="text-white font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Section — Shopify merchants get Managed Pricing only.
          Direct (non-Shopify) users see Stripe credit packs. */}
      {hasShopifyStore ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Store size={20} className="text-[#00f0ff]" />
            {s.shopifyBillingTitle || 'Subscription'}
          </h2>

          <div className="p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b] mb-4">
            <p className="text-sm text-slate-300 mb-2">
              {s.shopifyBillingDesc ||
                'Your subscription is managed by Shopify. Plans, billing details, and cancellation are handled in your Shopify admin.'}
            </p>
            <p className="text-xs text-slate-500">
              {profile?.shopify_subscription_status
                ? `${s.shopifyStatusLabel || 'Status'}: ${profile.shopify_subscription_status}`
                : (s.shopifyNoActivePlan || 'No active plan yet — pick one to unlock model downloads, AR links, and QR codes.')}
            </p>
          </div>

          <button
            onClick={handleManageShopifyBilling}
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-[#050a14] px-4 py-3 rounded-lg font-bold hover:bg-[#00f0ff]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingAction === 'shopify-billing' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Store className="w-5 h-5" />
            )}
            {s.manageOnShopify || 'Manage subscription on Shopify'}
          </button>
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap size={20} className="text-[#00f0ff]" />
            {c.title || 'Credits'}
          </h2>

          {/* Current Balance */}
          <div className={`p-4 rounded-lg border mb-6 ${
            creditBalance <= 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#0a0f1c] border-[#1e293b]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{c.creditsAvailable || 'Credits Available'}</p>
                <p className={`text-3xl font-bold ${creditBalance <= 0 ? 'text-red-400' : 'text-white'}`}>
                  {creditBalance}
                </p>
                <p className="text-xs text-slate-400 mt-1">{c.creditsDesc || 'Each credit unlocks one 3D model for download & sharing'}</p>
              </div>
              <Zap className={`w-8 h-8 ${creditBalance <= 0 ? 'text-red-400' : 'text-[#00f0ff]'}`} />
            </div>
          </div>

          {/* How it works note */}
          <div className="p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-lg mb-6">
            <p className="text-sm text-slate-300">
              {c.howItWorks || 'Generate 3D models for free from any product photo. Preview the result, then use 1 credit to unlock downloading, sharing AR links, and QR codes.'}
            </p>
          </div>

          {/* Buy Credits */}
          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium text-slate-300">{c.buyCredits || 'Buy Credits'}</p>
            {creditPacks.map((pack, i) => (
              <button
                key={i}
                onClick={() => handleBuyCredits(i)}
                disabled={loadingAction !== null}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  i === 1
                    ? 'border-[#00f0ff]/50 bg-[#00f0ff]/5 hover:bg-[#00f0ff]/10'
                    : 'border-[#1e293b] bg-[#0a0f1c] hover:border-[#00f0ff]/30'
                }`}
              >
                <div className="text-left">
                  <span className="text-white font-bold">
                    {pack.credits} {pack.credits === 1 ? 'Credit' : 'Credits'}
                  </span>
                  {i === 1 && (
                    <span className="ml-2 text-xs font-bold bg-[#00f0ff] text-[#050a14] px-2 py-0.5 rounded-full">
                      Best Value
                    </span>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{pack.perUnit}</p>
                </div>
                <div>
                  {loadingAction === `credit-${i}` ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#00f0ff]" />
                  ) : (
                    <span className="text-xl font-bold text-white">{pack.price}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[#00f0ff]" />
          {s.preferences}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{s.language}</p>
              <p className="text-slate-400 text-sm">{s.languageDesc}</p>
            </div>
            <div className="text-slate-300 text-sm">
              {s.languageNote}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{s.emailVerified}</p>
              <p className="text-slate-400 text-sm">{s.emailVerifiedDesc}</p>
            </div>
            <div>
              {user?.email_confirmed_at ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                  {s.verified}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium">
                  {s.notVerified}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-lg">
        <p className="text-slate-300 text-sm mb-3">
          {s.supportNote}
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
