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
        <div className="min-h-screen bg-[#060a13] text-slate-200 relative overflow-hidden bg-grid-pattern-dark">
          {/* Futuristic ambient glows */}
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#00f0ff]/5 blur-[100px] pointer-events-none z-0"></div>

          <Sidebar />
          
          <main className="md:ml-64 min-h-screen relative z-10 transition-all duration-300">
            <div className="p-6 md:p-12 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </DashboardLanguageProvider>
    </QueryProvider>
  )
}
