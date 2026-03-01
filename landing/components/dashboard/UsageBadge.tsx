'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function UsageBadge() {
  const supabase = createClient()

  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const response = await fetch('/api/usage')
      if (!response.ok) throw new Error('Failed to fetch usage')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-[#334155] rounded w-32 mb-2"></div>
        <div className="h-6 bg-[#334155] rounded w-24"></div>
      </div>
    )
  }

  if (!usage) return null

  const percentage = (usage.currentUsage / usage.limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = usage.hasExceeded

  return (
    <div className={`border rounded-lg p-4 ${
      isAtLimit
        ? 'bg-red-500/10 border-red-500/30'
        : isNearLimit
        ? 'bg-yellow-500/10 border-yellow-500/30'
        : 'bg-[#1e293b] border-[#334155]'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${
            isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-[#00f0ff]'
          }`} />
          <h3 className="font-semibold text-white">Monthly Usage</h3>
        </div>
        <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">
          {usage.planType}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${
            isAtLimit ? 'text-red-400' : 'text-white'
          }`}>
            {usage.currentUsage}
          </span>
          <span className="text-slate-400">/ {usage.limit}</span>
          <span className="text-sm text-slate-500">generations</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#0f172a] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-[#00f0ff]'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {isAtLimit && usage.planType === 'starter' && (
          <div className="mt-3 pt-3 border-t border-red-500/30">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors text-sm"
            >
              <TrendingUp size={16} />
              Upgrade to Growth
            </Link>
          </div>
        )}

        {isAtLimit && usage.planType === 'growth' && (
          <p className="mt-2 text-xs text-red-400">
            You've reached your monthly limit. Resets on the 1st.
          </p>
        )}

        {isNearLimit && !isAtLimit && (
          <p className="mt-2 text-xs text-yellow-400">
            {usage.remaining} generations remaining this month
          </p>
        )}
      </div>
    </div>
  )
}
