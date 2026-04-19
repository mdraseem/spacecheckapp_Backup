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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[4/5] bg-[#0f172a] rounded-xl animate-pulse border border-[#1e293b]" />
        ))}
      </div>
    )
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center mb-6">
            <Box className="w-12 h-12 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{dict.dashboard.noModels}</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          {dict.dashboard.noModelsDesc}
        </p>
        <Link
            href="/dashboard/create"
            className="flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors uppercase tracking-wide"
        >
            <PlusCircle size={20} />
            {dict.dashboard.createFirst}
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              {showSuccessMessage === 'credits' ? (
                <Zap className="w-5 h-5 text-green-400" />
              ) : showSuccessMessage === 'hosting' ? (
                <Server className="w-5 h-5 text-green-400" />
              ) : showSuccessMessage === 'unlock' ? (
                <Unlock className="w-5 h-5 text-green-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-green-400 font-semibold">
                {showSuccessMessage === 'credits'
                  ? (c.creditsPurchased || 'Credits Added!')
                  : showSuccessMessage === 'hosting'
                  ? (c.hostingActivated || 'Hosting Activated!')
                  : showSuccessMessage === 'unlock'
                  ? (c.modelUnlocked || 'Model Unlocked!')
                  : 'Payment Successful!'}
              </p>
              <p className="text-green-400/80 text-sm">
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
          <button onClick={() => setShowSuccessMessage(null)} className="text-green-400 hover:text-green-300">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Canceled Message */}
      {showCanceledMessage && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-yellow-400 text-sm">Payment was canceled. You can try again anytime.</p>
          </div>
          <button onClick={() => setShowCanceledMessage(false)} className="text-yellow-400 hover:text-yellow-300">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-white">{dict.dashboard.title}</h1>
            <p className="text-slate-400">{dict.dashboard.subtitle}</p>
        </div>
        <Link
            href="/dashboard/create"
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-slate-300 hover:text-white border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-lg transition-all text-sm font-medium"
        >
            <PlusCircle size={16} />
            {dict.dashboard.newScan}
        </Link>
      </div>

      {/* Usage Badge */}
      <div className="mb-8">
        <UsageBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {generations.map((model) => (
          // @ts-ignore
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  )
}
