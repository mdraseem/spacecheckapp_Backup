'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    // We need to get values from the form inputs manually since this is a button click
    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement

    if (!emailInput.value || !passwordInput.value) {
        setError("Please enter both email and password")
        setIsLoading(false)
        return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const emailInput = document.getElementById('email') as HTMLInputElement

    if (!emailInput.value) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a password reset link')
        setShowForgotPassword(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            <span className="text-white">Space</span>
            <span className="text-[#00f0ff]">Check</span>
          </h1>
          <p className="text-slate-400 text-sm">Enter the AR Dimension</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <AlertCircle size={16} />
            {message}
          </div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-slate-400 text-sm">Enter your email to receive a reset link</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-[#00f0ff]" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all placeholder-slate-600 text-white"
                placeholder="pilot@spacecheck.io"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] font-bold py-3 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full bg-transparent border border-[#1e293b] hover:bg-[#1e293b] text-slate-400 hover:text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-[#00f0ff]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all placeholder-slate-600 text-white"
              placeholder="pilot@spacecheck.io"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-[#00f0ff]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all placeholder-slate-600 text-white"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] font-bold py-3 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full bg-transparent border border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 text-[#00f0ff] font-bold py-3 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          By accessing the system, you agree to our Terms of Service.
        </div>
      </div>
    </div>
  )
}