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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-[#334155] rounded w-32 mb-2"></div>
          <div className="h-6 bg-[#334155] rounded w-24"></div>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-[#334155] rounded w-32 mb-2"></div>
          <div className="h-6 bg-[#334155] rounded w-24"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Credits Card */}
      <div className={`border rounded-lg p-4 ${
        noCredits
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-[#1e293b] border-[#334155]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${noCredits ? 'text-red-400' : 'text-[#00f0ff]'}`} />
            <h3 className="font-semibold text-white">{c.creditsAvailable || 'Credits Available'}</h3>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-3xl font-bold ${noCredits ? 'text-red-400' : 'text-white'}`}>
            {creditBalance}
          </span>
          <span className="text-sm text-slate-400">{c.creditsDesc || 'credits'}</span>
        </div>

        {noCredits && (
          <div className="mt-3 pt-3 border-t border-red-500/30">
            <p className="text-xs text-red-400 mb-2">{c.noCreditsDesc || 'Purchase credits to unlock and download models.'}</p>
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors text-sm"
            >
              <Zap size={16} />
              {c.buyCredits || 'Buy Credits'}
            </Link>
          </div>
        )}
      </div>

      {/* Models Status Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-semibold text-white">{c.modelsStatus || 'Models'}</h3>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm flex items-center gap-1.5">
              <Unlock size={14} className="text-green-400" />
              {unlockedModels} {c.unlockedLabel || 'unlocked'}
            </span>
            {lockedModels > 0 && (
              <span className="text-slate-400 text-sm flex items-center gap-1.5">
                <Lock size={14} className="text-amber-400" />
                {lockedModels} {c.lockedLabel || 'locked'}
              </span>
            )}
          </div>
        </div>

        {lockedModels > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {c.unlockHint || 'Unlock models to share AR links, download files, and get QR codes.'}
          </p>
        )}
      </div>
    </div>
  )
}
