'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Mail, Calendar, Shield, Loader2 } from 'lucide-react'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const { dict } = useDashboardLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{dict.settings.title}</h1>
        <p className="text-slate-400">{dict.settings.subtitle}</p>
      </div>

      {/* Account Information */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User size={20} className="text-[#00f0ff]" />
          {dict.settings.accountInfo}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Mail size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.email}</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 flex items-center justify-center">
              <Calendar size={20} className="text-[#00f0ff]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.memberSince}</p>
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
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{dict.settings.userId}</p>
              <p className="text-white font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[#00f0ff]" />
          {dict.settings.preferences}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{dict.settings.language}</p>
              <p className="text-slate-400 text-sm">{dict.settings.languageDesc}</p>
            </div>
            <div className="text-slate-300 text-sm">
              {dict.settings.languageNote}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b]">
            <div>
              <p className="text-white font-medium mb-1">{dict.settings.emailVerified}</p>
              <p className="text-slate-400 text-sm">{dict.settings.emailVerifiedDesc}</p>
            </div>
            <div>
              {user?.email_confirmed_at ? (
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                  {dict.settings.verified}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium">
                  {dict.settings.notVerified}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-lg">
        <p className="text-slate-300 text-sm">
          {dict.settings.supportNote}{' '}
          <a href="mailto:support@spacecheck.app" className="text-[#00f0ff] hover:underline">
            support@spacecheck.app
          </a>
        </p>
      </div>
    </div>
  )
}
