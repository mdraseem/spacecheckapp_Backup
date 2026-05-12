'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'
import { trackConversion, trackPageView } from '@/utils/track'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Honour ?redirect= param so OAuth flows (Shopify etc.) resume after login
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  )
  const redirectAfterLogin = searchParams.get('redirect') || '/dashboard'

  // Track page view
  useEffect(() => {
    trackPageView('login', { action: 'viewed' });
  }, []);

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
        router.push(redirectAfterLogin)
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
      // Track signup initiation
      trackConversion('signup', 'initiated', { method: 'email' });

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
        // Track signup completion
        trackConversion('signup', 'completed', { method: 'email' });
        setMessage('Check your email to confirm your account')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    setError(null)

    try {
      trackConversion('signup', 'initiated', { method: provider });

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfterLogin)}`,
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
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

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e293b]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0f172a] px-3 text-slate-500 uppercase tracking-widest">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          By accessing the system, you agree to our{' '}
          <Link href="/terms" className="text-[#00f0ff] hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#00f0ff] hover:underline">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  )
}