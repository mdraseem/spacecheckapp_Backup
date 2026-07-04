'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { ModelCard } from '@/components/dashboard/ModelCard'
import { UsageBadge } from '@/components/dashboard/UsageBadge'
import { PlusCircle, Box, CheckCircle, Zap, Server, Unlock, X } from 'lucide-react'
import Link from 'next/link'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const supabase = createClient()
  const { dict } = useDashboardLanguage()
  const c = dict.credits || {} as any
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showCanceledMessage, setShowCanceledMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('credits_purchased') === 'true') {
      setShowSuccessMessage('credits')
      setTimeout(() => setShowSuccessMessage(null), 10000)
    } else if (searchParams.get('hosting_activated') === 'true') {
      setShowSuccessMessage('hosting')
      setTimeout(() => setShowSuccessMessage(null), 10000)
    } else if (searchParams.get('model_unlocked') === 'true') {
      setShowSuccessMessage('unlock')
      setTimeout(() => setShowSuccessMessage(null), 10000)
    } else if (searchParams.get('success') === 'true') {
      setShowSuccessMessage('generic')
      setTimeout(() => setShowSuccessMessage(null), 10000)
    }
    if (searchParams.get('canceled') === 'true') {
      setShowCanceledMessage(true)
      setTimeout(() => setShowCanceledMessage(false), 5000)
    }
  }, [searchParams])

  const { data: generations, isLoading } = useQuery({
    queryKey: ['generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    // Refetch if any item is still being processed
    refetchInterval: (query) => {
        const data = query.state.data as any[] | undefined
        const hasActiveGeneration = data?.some(item => item.status === 'processing')
        return hasActiveGeneration ? 3000 : false
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-64 bg-[#0f172a] rounded-xl border border-[#1e293b]/50" />
        <div className="h-20 bg-[#0f172a] rounded-2xl border border-[#1e293b]/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] bg-[#0f172a] rounded-2xl border border-[#1e293b]/50 flex flex-col justify-between p-4">
              <div className="aspect-square bg-[#0c1322] rounded-xl" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-[#0c1322] rounded-full w-2/3" />
                <div className="h-3 bg-[#0c1322] rounded-full w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="glass-card-dark rounded-3xl p-12 max-w-md w-full border border-[#1e293b]/40 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="w-20 h-20 bg-slate-900/80 border border-[#1e293b] rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Box className="w-10 h-10 text-slate-500 group-hover:text-[#00f0ff] transition-colors duration-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">{dict.dashboard.noModels}</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
            {dict.dashboard.noModelsDesc}
          </p>
          <Link
              href="/dashboard/create"
              className="glow-btn flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00f0ff] text-[#050a14] font-bold rounded-xl hover:bg-[#00f0ff]/90 transition-all uppercase tracking-wide text-xs shadow-lg shadow-[#00f0ff]/15"
          >
              <PlusCircle size={16} />
              {dict.dashboard.createFirst}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
              {showSuccessMessage === 'credits' ? (
                <Zap className="w-4 h-4 text-green-400" />
              ) : showSuccessMessage === 'hosting' ? (
                <Server className="w-4 h-4 text-green-400" />
              ) : showSuccessMessage === 'unlock' ? (
                <Unlock className="w-4 h-4 text-green-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-green-400 text-sm font-bold">
                {showSuccessMessage === 'credits'
                  ? (c.creditsPurchased || 'Credits Added!')
                  : showSuccessMessage === 'hosting'
                  ? (c.hostingActivated || 'Hosting Activated!')
                  : showSuccessMessage === 'unlock'
                  ? (c.modelUnlocked || 'Model Unlocked!')
                  : 'Payment Successful!'}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {showSuccessMessage === 'credits'
                  ? (c.creditsPurchasedDesc || 'Your credits have been added to your account. You can now generate new models.')
                  : showSuccessMessage === 'hosting'
                  ? (c.hostingActivatedDesc || 'Your AR links are now live and publicly accessible.')
                  : showSuccessMessage === 'unlock'
                  ? (c.modelUnlockedDesc || 'Your model is now unlocked! You can share it, download files, and generate QR codes.')
                  : (c.paymentSuccess || 'Your payment has been processed successfully.')}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSuccessMessage(null)} className="text-slate-400 hover:text-white hover:bg-slate-800/40 p-1.5 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Canceled Message */}
      {showCanceledMessage && (
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <p className="text-yellow-400 text-xs font-semibold">Payment was canceled. You can try again anytime.</p>
          </div>
          <button onClick={() => setShowCanceledMessage(false)} className="text-slate-400 hover:text-white hover:bg-slate-800/40 p-1.5 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#1e293b]/40 pb-6">
        <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white">{dict.dashboard.title}</h1>
            <p className="text-sm text-slate-400 mt-1">{dict.dashboard.subtitle}</p>
        </div>
        <Link
            href="/dashboard/create"
            className="glow-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-xl text-xs font-bold text-slate-200 hover:text-[#00f0ff] transition-all"
        >
            <PlusCircle size={14} />
            {dict.dashboard.newScan}
        </Link>
      </div>

      {/* Usage Badge */}
      <div className="p-0 border border-transparent">
        <UsageBadge />
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {generations.map((model) => (
          // @ts-ignore
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  )
}
