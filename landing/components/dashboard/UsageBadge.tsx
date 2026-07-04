'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Zap, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export function UsageBadge() {
  const supabase = createClient()
  const { dict } = useDashboardLanguage()
  const c = dict.credits || {} as any

  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const response = await fetch('/api/usage')
      if (!response.ok) throw new Error('Failed to fetch usage')
      return response.json()
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 animate-pulse">
          <div className="h-4 bg-[#1e293b] rounded-full w-32 mb-4"></div>
          <div className="h-8 bg-[#1e293b] rounded-full w-24"></div>
        </div>
        <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 animate-pulse">
          <div className="h-4 bg-[#1e293b] rounded-full w-32 mb-4"></div>
          <div className="h-8 bg-[#1e293b] rounded-full w-24"></div>
        </div>
      </div>
    )
  }

  if (!usage) return null

  const creditBalance = usage.creditBalance ?? 0
  const unlockedModels = usage.unlockedModels ?? 0
  const lockedModels = usage.lockedModels ?? 0
  const noCredits = creditBalance <= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Credits Card */}
      <div className={`border rounded-2xl p-6 transition-all duration-300 ${
        noCredits
          ? 'bg-red-500/5 border-red-500/20 shadow-[0_10px_35px_rgba(239,68,68,0.02)]'
          : 'glass-card-dark border-[#1e293b]/60 shadow-lg'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Zap className={`w-5 h-5 ${noCredits ? 'text-red-400' : 'text-[#00f0ff]'}`} />
            <h3 className="font-display font-bold text-white text-sm tracking-wide">{c.creditsAvailable || 'Credits Available'}</h3>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-4xl font-black font-display ${noCredits ? 'text-red-400' : 'text-white'}`}>
            {creditBalance}
          </span>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{c.creditsDesc || 'credits'}</span>
        </div>

        {noCredits && (
          <div className="mt-4 pt-4 border-t border-red-500/10">
            <p className="text-xs text-red-400/80 mb-4 leading-relaxed font-semibold">{c.noCreditsDesc || 'Purchase credits to unlock and download models.'}</p>
            <Link
              href="/dashboard/settings"
              className="glow-btn flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-xl hover:bg-[#00f0ff]/90 transition-all text-xs uppercase tracking-wide shadow-md shadow-[#00f0ff]/15"
            >
              <Zap size={14} />
              {c.buyCredits || 'Buy Credits'}
            </Link>
          </div>
        )}
      </div>

      {/* Models Status Card */}
      <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Unlock className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-display font-bold text-white text-sm tracking-wide">{c.modelsStatus || 'Models'}</h3>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-200 text-sm font-semibold flex items-center gap-2 bg-slate-900/50 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <Unlock size={14} className="text-green-400" />
              {unlockedModels} <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{c.unlockedLabel || 'unlocked'}</span>
            </span>
            {lockedModels > 0 && (
              <span className="text-slate-200 text-sm font-semibold flex items-center gap-2 bg-slate-900/50 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                <Lock size={14} className="text-amber-400" />
                {lockedModels} <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{c.lockedLabel || 'locked'}</span>
              </span>
            )}
          </div>
        </div>

        {lockedModels > 0 && (
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-semibold">
            {c.unlockHint || 'Unlock models to share AR links, download files, and get QR codes.'}
          </p>
        )}
      </div>
    </div>
  )
}
