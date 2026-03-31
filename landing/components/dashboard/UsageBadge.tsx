'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Zap, Server, AlertTriangle, Clock } from 'lucide-react'
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
  const hostingStatus = usage.hostingStatus || 'paused'
  const hostingExpiresAt = usage.hostingExpiresAt
  const activeModels = usage.activeModels ?? 0
  const archivedModels = usage.archivedModels ?? 0
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
            <p className="text-xs text-red-400 mb-2">{c.noCreditsDesc || 'Purchase credits to generate models.'}</p>
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

      {/* Hosting Status Card */}
      <div className={`border rounded-lg p-4 ${
        hostingStatus === 'paused'
          ? 'bg-orange-500/10 border-orange-500/30'
          : hostingStatus === 'trial'
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-green-500/10 border-green-500/30'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className={`w-5 h-5 ${
              hostingStatus === 'paused' ? 'text-orange-400'
                : hostingStatus === 'trial' ? 'text-blue-400'
                : 'text-green-400'
            }`} />
            <h3 className="font-semibold text-white">{c.hostingStatus || 'Hosting Status'}</h3>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
            hostingStatus === 'active' ? 'bg-green-500/20 text-green-400'
              : hostingStatus === 'trial' ? 'bg-blue-500/20 text-blue-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            {hostingStatus === 'active' ? (c.hostingActive || 'Active')
              : hostingStatus === 'trial' ? (c.hostingTrial || 'Trial')
              : (c.hostingPaused || 'Paused')}
          </span>
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-white text-sm">
            {activeModels} {c.activeModels || 'active'}
            {archivedModels > 0 && (
              <span className="text-slate-400"> / {archivedModels} {c.archivedModels || 'paused'}</span>
            )}
          </span>
        </div>

        {hostingStatus === 'trial' && hostingExpiresAt && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400">
            <Clock size={12} />
            <span>{c.hostingExpires || 'Expires'}: {new Date(hostingExpiresAt).toLocaleDateString()}</span>
          </div>
        )}

        {hostingStatus === 'paused' && (
          <div className="mt-3 pt-3 border-t border-orange-500/30">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-orange-400">
              <AlertTriangle size={12} />
              <span>{c.hostingPausedDesc || 'AR links are not publicly accessible.'}</span>
            </div>
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors text-sm"
            >
              <Server size={16} />
              {c.activateHosting || 'Activate Hosting'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
