'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Calendar, Shield, Loader2, Store, Zap, Server, Clock, AlertTriangle } from 'lucide-react'
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

  const billingSource = profile?.billing_source || 'stripe'
  const isShopifyBilled = billingSource === 'shopify'
  const hostingStatus = profile?.hosting_status || 'trial'
  const creditBalance = profile?.credit_balance ?? 0

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch profile with credit & hosting info
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

  const handleActivateHosting = async () => {
    setLoadingAction('hosting')
    try {
      if (hasShopifyStore) {
        const response = await fetch('/api/shopify/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to create Shopify subscription')
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl
          return
        }
      }

      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_HOSTING
      if (!priceId) {
        alert('Hosting plan not configured.')
        return
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      console.error('Hosting checkout error:', error)
      alert(error.message || 'Failed to start checkout')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingAction('manage')
    try {
      if (isShopifyBilled) {
        const supabase = createClient()
        const { data: store } = await supabase
          .from('shopify_stores')
          .select('shop_domain')
          .eq('user_id', user.id)
          .single()

        if (store?.shop_domain) {
          window.open(`https://${store.shop_domain}/admin/settings/billing`, '_blank')
          setLoadingAction(null)
          return
        }
      }

      const response = await fetch('/api/create-portal', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal')
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      console.error('Portal error:', error)
      alert(error.message || 'Failed to open billing portal')
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
    { credits: 1, price: '$15', perUnit: '$15 / model' },
    { credits: 5, price: '$59', perUnit: '$11.80 / model' },
    { credits: 20, price: '$199', perUnit: '$9.95 / model' },
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

      {/* Credits Section */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap size={20} className="text-[#00f0ff]" />
          {c.title || 'Credits & Hosting'}
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
              <p className="text-xs text-slate-400 mt-1">{c.creditsDesc || 'Each credit generates one 3D model'}</p>
            </div>
            <Zap className={`w-8 h-8 ${creditBalance <= 0 ? 'text-red-400' : 'text-[#00f0ff]'}`} />
          </div>
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

      {/* Hosting Section */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Server size={20} className="text-[#00f0ff]" />
          {c.hostingStatus || 'Hosting Status'}
        </h2>

        <div className={`p-4 rounded-lg border mb-4 ${
          hostingStatus === 'active'
            ? 'bg-green-500/10 border-green-500/30'
            : hostingStatus === 'trial'
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${
                hostingStatus === 'active' ? 'text-green-400'
                  : hostingStatus === 'trial' ? 'text-blue-400'
                  : 'text-orange-400'
              }`} />
              <span className="text-white font-medium">{c.hostingDesc || 'Controls whether your AR links are publicly accessible'}</span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              hostingStatus === 'active' ? 'bg-green-500/20 text-green-400'
                : hostingStatus === 'trial' ? 'bg-blue-500/20 text-blue-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              {hostingStatus === 'active' ? (c.hostingActive || 'Active')
                : hostingStatus === 'trial' ? (c.hostingTrial || 'Trial')
                : (c.hostingPaused || 'Paused')}
            </span>
          </div>

          {hostingStatus === 'trial' && profile?.hosting_expires_at && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400">
              <Clock size={12} />
              <span>{c.hostingExpires || 'Expires'}: {new Date(profile.hosting_expires_at).toLocaleDateString()}</span>
            </div>
          )}

          {hostingStatus === 'paused' && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-400">
              <AlertTriangle size={12} />
              <span>{c.hostingPausedDesc || 'Your AR links are not publicly accessible.'}</span>
            </div>
          )}

          {isShopifyBilled && (
            <div className="flex items-center gap-1 mt-2">
              <span className="px-2 py-1 bg-[#96bf48]/10 text-[#96bf48] rounded text-xs font-medium flex items-center gap-1">
                <Store size={12} />
                via Shopify
              </span>
            </div>
          )}
        </div>

        {/* Hosting Actions */}
        <div className="space-y-3">
          {(hostingStatus === 'paused' || hostingStatus === 'trial') && (
            <button
              onClick={handleActivateHosting}
              disabled={loadingAction !== null}
              className="w-full px-4 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingAction === 'hosting' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Server size={16} />
                  {hostingStatus === 'paused'
                    ? (c.activateHosting || 'Activate Hosting — $29/mo')
                    : (c.activateHosting || 'Activate Hosting — $29/mo')}
                </>
              )}
            </button>
          )}

          {hostingStatus === 'active' && (profile?.stripe_customer_id || isShopifyBilled) && (
            <button
              onClick={handleManageSubscription}
              disabled={loadingAction !== null}
              className="w-full px-4 py-3 bg-transparent border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 hover:text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingAction === 'manage' ? (
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
                c.manageHosting || 'Manage Hosting'
              )}
            </button>
          )}
        </div>
      </div>

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
