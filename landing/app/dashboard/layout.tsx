import { Sidebar } from '@/components/dashboard/Sidebar'
import QueryProvider from '@/components/providers/QueryProvider'
import { DashboardLanguageProvider } from '@/contexts/DashboardLanguageContext'
import { getDashboardDictionary } from '@/get-dashboard-dictionary'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard | Furnite AR',
  description: 'Manage your 3D AR furniture models',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dict = await getDashboardDictionary('en');

  return (
    <QueryProvider>
      <DashboardLanguageProvider initialDict={dict}>
        <div className="min-h-screen bg-[#0a0f1c] text-slate-200">
          <Sidebar />
          <main className="md:ml-64 min-h-screen">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </DashboardLanguageProvider>
    </QueryProvider>
  )
}
