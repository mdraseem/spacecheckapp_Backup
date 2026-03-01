'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050a14] text-white overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1a3a52] opacity-20 blur-[100px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#208a93] opacity-10 blur-[120px]"></div>
        </div>

        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] shadow-2xl z-10 relative text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter mb-2 text-white">
            Password Updated!
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Your password has been successfully reset. Redirecting to dashboard...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-[#00f0ff] mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050a14] text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1a3a52] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#208a93] opacity-10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f172a]/80 backdrop-blur-md border border-[#1e293b] shadow-2xl z-10 relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#00f0ff]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter mb-2 text-white">
            Set New Password
          </h1>
          <p className="text-slate-400 text-sm">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-[#00f0ff]" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all placeholder-slate-600 text-white"
              placeholder="••••••••"
              minLength={6}
            />
            <p className="text-xs text-slate-500">Minimum 6 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-[#00f0ff]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all placeholder-slate-600 text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] font-bold py-3 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Password'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Remember your password?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[#00f0ff] hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
