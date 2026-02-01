import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="text-center max-w-2xl">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-[150px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary leading-none">
            404
          </div>
          <div className="flex items-center justify-center gap-4 text-gray-400 mt-4">
            <div className="w-20 h-1 bg-gradient-to-r from-transparent to-secondary rounded-full"></div>
            <Search className="w-8 h-8" />
            <div className="w-20 h-1 bg-gradient-to-l from-transparent to-secondary rounded-full"></div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-primary mb-4">
          Page Not Found
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
          >
            <Home size={20} />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} />
            Dashboard
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/en#features" className="text-secondary hover:underline">
              Features
            </Link>
            <Link href="/en#pricing" className="text-secondary hover:underline">
              Pricing
            </Link>
            <Link href="/en#demo" className="text-secondary hover:underline">
              Demo
            </Link>
            <Link href="/login" className="text-secondary hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
