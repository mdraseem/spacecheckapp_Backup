'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Box, PlusCircle, Settings, LogOut, Menu, Languages, Store, User, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { lang, setLang, dict } = useDashboardLanguage()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    fetchUser()
  }, [])

  const navItems = [
    { name: dict.sidebar.myModels, href: '/dashboard', icon: Box },
    { name: dict.sidebar.createNew, href: '/dashboard/create', icon: PlusCircle },
    { name: dict.sidebar?.shopify || 'Shopify', href: '/dashboard/shopify', icon: Store },
    { name: dict.sidebar.settings, href: '/dashboard/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-3 bg-[#0a0f1c]/80 backdrop-blur-md border border-[#1e293b] rounded-xl text-white shadow-lg flex items-center justify-center hover:bg-[#1e293b]/90 transition-all"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#070b16] border-r border-[#1e293b]/60 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-[#1e293b]/60">
            <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-0.5">
              <span>Space</span>
              <span className="text-[#00f0ff]">Check</span>
            </span>
            
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-[#00f0ff] hover:bg-[#1e293b]/50 border border-slate-800 rounded-lg transition-all"
              title="Change Language"
            >
              <Languages size={14} />
              {lang === 'en' ? 'PL' : 'EN'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00f0ff]/10 to-[#00f0ff]/0 text-[#00f0ff]'
                      : 'text-slate-400 hover:text-white hover:bg-[#11192d]/50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {/* Left glowing marker indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-[#00f0ff] rounded-r-full shadow-[0_0_10px_#00f0ff]"></span>
                  )}
                  <item.icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#00f0ff]' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-[#1e293b]/60 bg-[#040811]/50">
            {userEmail && (
              <div className="flex items-center gap-3 px-4 py-2.5 mb-3 bg-[#0c1426]/60 border border-[#1e293b]/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00f0ff]/30 to-blue-600/30 border border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#00f0ff]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">User Account</p>
                  <p className="text-xs text-slate-300 font-semibold truncate leading-none" title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={18} className="text-slate-400 group-hover:text-red-400" />
              {dict.sidebar.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
