'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Store, ArrowRight, Box, Wand2, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: 'Missing parameters from Shopify. Please try again.',
  invalid_shop: 'Invalid shop domain. Please check and try again.',
  invalid_nonce: 'Security validation failed. Please try again.',
  invalid_hmac: 'Request signature invalid. Please try again.',
  db_error: 'Failed to save connection. Please try again.',
  token_exchange_failed: 'Failed to connect to Shopify. Please try again.',
  session_expired: 'Your session expired before the connection could complete. Please try again.',
  not_connected: 'No Shopify store connected. Please connect your store below.',
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1c]" />}>
      <ConnectPageContent />
    </Suspense>
  )
}

function normalizeShopDomain(input: string): string {
  let domain = input.trim().toLowerCase()
  domain = domain.replace(/^https?:\/\//, '')
  domain = domain.split('/')[0]
  if (!domain.endsWith('.myshopify.com')) {
    domain = `${domain}.myshopify.com`
  }
  return domain
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop)
}

function ConnectPageContent() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')

  // Compute initial values synchronously from URL so we don't trigger
  // cascading renders from inside useEffect.
  const shopParam = searchParams.get('shop')
  const normalizedFromUrl = shopParam ? normalizeShopDomain(shopParam) : null
  const shouldAutoRedirect = !!normalizedFromUrl && isValidShopDomain(normalizedFromUrl)

  const initialDomain = shouldAutoRedirect
    ? normalizedFromUrl!.replace('.myshopify.com', '')
    : (shopParam ?? '')

  const [shopDomain, setShopDomain] = useState(initialDomain)
  const [isLoading, setIsLoading] = useState(shouldAutoRedirect)
  const [autoRedirecting] = useState(shouldAutoRedirect)

  // Auto-redirect to /api/shopify/install when shop param is present & valid.
  // Side-effect only (navigation), no setState inside the effect.
  useEffect(() => {
    if (shouldAutoRedirect && normalizedFromUrl) {
      window.location.href = `/api/shopify/install?shop=${encodeURIComponent(normalizedFromUrl)}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = () => {
    if (!shopDomain.trim()) return
    setIsLoading(true)
    const domain = normalizeShopDomain(shopDomain)
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(domain)}`
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
      {/* Header */}
      <header className="border-b border-[#1e293b] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            SpaceCheck<span className="text-[#00f0ff]">.app</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-full text-[#00f0ff] text-sm font-medium mb-6">
            <Store size={16} />
            Shopify Integration
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Add AR to your Shopify store
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Connect your Shopify store, pick a product, enter its dimensions — and we handle the rest.
            A 3D model is generated from the product photo and automatically uploaded to Shopify.
            Your customers see it in AR on the product page.
          </p>
        </div>

        {/* Auto-redirect notice */}
        {autoRedirecting && (
          <div className="max-w-lg mx-auto mb-8 p-4 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-xl text-center">
            <p className="text-[#00f0ff] text-sm">
              Detected your store — redirecting to Shopify...
            </p>
          </div>
        )}

        {/* Error message */}
        {errorCode && (
          <div className="max-w-lg mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">
              {ERROR_MESSAGES[errorCode] || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Connect form */}
        <div className="max-w-lg mx-auto bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 mb-16">
          <h2 className="text-xl font-bold text-white mb-2">Connect your store</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your Shopify store name to get started. You will be redirected to Shopify to authorize the connection.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Store domain
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    placeholder="yourstore"
                    className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg pl-4 pr-32 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                    .myshopify.com
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={!shopDomain.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                'Redirecting to Shopify...'
              ) : (
                <>
                  Connect Store
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center">
            You will be asked to approve read/write access to your products.
            SpaceCheck only accesses product data and media — nothing else.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                step: '1',
                title: 'Connect your store',
                desc: 'Enter your store name and authorize. Your product catalog appears in the dashboard instantly.',
              },
              {
                icon: Wand2,
                step: '2',
                title: 'Pick a product & enter size',
                desc: 'Select a product, choose a photo, and fill in the real-world dimensions (width, height, depth).',
              },
              {
                icon: Sparkles,
                step: '3',
                title: 'Done — it\'s automatic',
                desc: 'AI generates the 3D model and uploads it to your Shopify product as media. Customers can view it in AR.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <div className="text-xs text-[#00f0ff] font-bold mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ-like note */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#00f0ff] hover:underline">
              Sign in
            </Link>{' '}
            and connect your store from the dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}
