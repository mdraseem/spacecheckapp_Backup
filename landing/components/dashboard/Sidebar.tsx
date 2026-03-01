'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Box, PlusCircle, Settings, LogOut, Menu, Languages } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { lang, setLang, dict } = useDashboardLanguage()

  const navItems = [
    { name: dict.sidebar.myModels, href: '/dashboard', icon: Box },
    { name: dict.sidebar.createNew, href: '/dashboard/create', icon: PlusCircle },
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
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-[#1e293b] rounded-md text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#050a14] border-r border-[#1e293b] transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e293b]">
            <div>
              <span className="text-xl font-bold text-white">Space</span>
              <span className="text-xl font-bold text-[#00f0ff]">Check</span>
            </div>
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'pl' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
              title="Change Language"
            >
              <Languages size={16} />
              {lang === 'en' ? 'PL' : 'EN'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-[#1e293b]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              {dict.sidebar.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
