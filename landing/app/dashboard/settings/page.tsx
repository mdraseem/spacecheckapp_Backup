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

        // Check if user has a connected Shopify store (may have multiple)
        const { data: storeData } = await supabase
          .from('shopify_stores')
          .select('shop_domain')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

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
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="border-b border-[#1e293b]/40 pb-6">
        <h1 className="font-display text-3xl font-black text-white">{s.title}</h1>
        <p className="text-sm text-slate-400 mt-1">{s.subtitle}</p>
      </div>

      {/* Account Information */}
      <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl">
        <h2 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2.5">
          <span className="w-1.5 h-5 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"></span>
          {s.accountInfo}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/10 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{s.email}</p>
              <p className="text-sm text-white font-semibold truncate leading-tight">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{s.memberSince}</p>
              <p className="text-sm text-white font-semibold leading-tight">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/5 border border-[#00f0ff]/10 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{s.userId}</p>
              <p className="text-xs text-slate-300 font-mono leading-tight truncate">{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Section — Shopify merchants get Managed Pricing only.
          Direct (non-Shopify) users see Stripe credit packs. */}
      {hasShopifyStore ? (
        <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl">
          <h2 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"></span>
            {s.shopifyBillingTitle || 'Subscription'}
          </h2>

          <div className="p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30 mb-6">
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {s.shopifyBillingDesc ||
                'Your subscription is managed by Shopify. Plans, billing details, and cancellation are handled in your Shopify admin.'}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {profile?.shopify_subscription_status
                ? `${s.shopifyStatusLabel || 'Status'}: ${profile.shopify_subscription_status}`
                : (s.shopifyNoActivePlan || 'No active plan yet — pick one to unlock model downloads, AR links, and QR codes.')}
            </p>
          </div>

          <button
            onClick={handleManageShopifyBilling}
            disabled={loadingAction !== null}
            className="glow-btn w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-[#050a14] px-5 py-3.5 rounded-xl font-bold hover:bg-[#00f0ff]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wide"
          >
            {loadingAction === 'shopify-billing' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Store className="w-4 h-4" />
            )}
            {s.manageOnShopify || 'Manage subscription on Shopify'}
          </button>
        </div>
      ) : (
        <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl">
          <h2 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"></span>
            {c.title || 'Credits'}
          </h2>

          {/* Current Balance */}
          <div className={`p-5 rounded-xl border mb-6 transition-colors ${
            creditBalance <= 0
              ? 'bg-red-500/5 border-red-500/20 shadow-[0_10px_30px_rgba(239,68,68,0.02)]'
              : 'bg-[#070b16] border-[#1e293b]/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{c.creditsAvailable || 'Credits Available'}</p>
                <p className={`text-4xl font-black font-display ${creditBalance <= 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {creditBalance}
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">{c.creditsDesc || 'Each credit unlocks one 3D model for download & sharing'}</p>
              </div>
              <Zap className={`w-8 h-8 ${creditBalance <= 0 ? 'text-red-400' : 'text-[#00f0ff]'}`} />
            </div>
          </div>

          {/* How it works note */}
          <div className="p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-xl mb-6">
            <p className="text-xs text-slate-350 leading-relaxed font-semibold">
              {c.howItWorks || 'Generate 3D models for free from any product photo. Preview the result, then use 1 credit to unlock downloading, sharing AR links, and QR codes.'}
            </p>
          </div>

          {/* Buy Credits */}
          <div className="space-y-3.5 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.buyCredits || 'Buy Credits'}</p>
            {creditPacks.map((pack, i) => (
              <button
                key={i}
                onClick={() => handleBuyCredits(i)}
                disabled={loadingAction !== null}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  i === 1
                    ? 'border-[#00f0ff]/50 bg-[#00f0ff]/5 hover:bg-[#00f0ff]/10'
                    : 'border-[#1e293b]/40 bg-[#070b16] hover:border-[#00f0ff]/30'
                }`}
              >
                <div className="text-left">
                  <span className="text-white font-bold text-sm flex items-center gap-2">
                    {pack.credits} {pack.credits === 1 ? 'Credit' : 'Credits'}
                    {i === 1 && (
                      <span className="text-[9px] font-bold bg-[#00f0ff] text-[#050a14] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Best Value
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{pack.perUnit}</p>
                </div>
                <div>
                  {loadingAction === `credit-${i}` ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#00f0ff]" />
                  ) : (
                    <span className="text-lg font-black text-white">{pack.price}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 shadow-xl">
        <h2 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2.5">
          <span className="w-1.5 h-5 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"></span>
          {s.preferences}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30">
            <div>
              <p className="text-white text-sm font-semibold mb-0.5">{s.language}</p>
              <p className="text-slate-400 text-xs">{s.languageDesc}</p>
            </div>
            <div className="text-slate-350 text-xs font-semibold">
              {s.languageNote}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#070b16] rounded-xl border border-[#1e293b]/30">
            <div>
              <p className="text-white text-sm font-semibold mb-0.5">{s.emailVerified}</p>
              <p className="text-slate-400 text-xs">{s.emailVerifiedDesc}</p>
            </div>
            <div>
              {user?.email_confirmed_at ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                  {s.verified}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                  {s.notVerified}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-[#00f0ff]/5 border border-[#00f0ff]/15 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <p className="text-slate-300 text-xs leading-relaxed font-semibold">
            {s.supportNote || 'Need help or have custom requests? Contact our flight crew directly.'}
          </p>
        </div>
        <Link
          href="/contact"
          className="bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-center flex-shrink-0 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
