'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a14] text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1a3a52] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#208a93] opacity-10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] shadow-2xl z-10 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter mb-2 text-white">
            Authentication Error
          </h1>
          <p className="text-slate-400 text-sm">Something went wrong during sign in</p>
        </div>

        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm leading-relaxed">
            The authentication link is invalid or has expired. This can happen if:
          </p>
          <ul className="mt-3 space-y-2 text-red-400 text-sm list-disc list-inside">
            <li>The link was already used</li>
            <li>The link has expired (links expire after 1 hour)</li>
            <li>There was a network error</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] font-bold py-3 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <p className="text-center text-xs text-slate-500">
            Need help?{' '}
            <Link href="/contact" className="text-[#00f0ff] hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
