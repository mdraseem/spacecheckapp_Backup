'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';
import { shouldShowBanner, setConsent, getConsent } from '@/utils/cookie-consent';

interface CookieBannerProps {
  lang: string;
}

export default function CookieBanner({ lang }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show banner if no consent decision has been made
    if (shouldShowBanner()) {
      // Small delay to avoid flash on page load
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  const handleAccept = () => {
    setConsent('accepted');
    closeBanner();
  };

  const handleReject = () => {
    setConsent('rejected');
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  const content = {
    title: 'This website uses cookies',
    description: 'We use essential cookies for authentication and analytics cookies to track AR usage. We do not use advertising cookies or third‑party tracking.',
    accept: 'Accept all',
    reject: 'Reject optional',
    learnMore: 'Learn more',
    privacyHref: '/privacy',
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm pointer-events-none" />

      {/* Banner content */}
      <div className="relative bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-primary mb-1">
                {content.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {content.description}{' '}
                <Link
                  href={`/${lang}/privacy`}
                  className="text-secondary hover:underline font-medium"
                >
                  {content.learnMore}
                </Link>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-shrink-0">
              <button
                onClick={handleReject}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                aria-label={content.reject}
              >
                {content.reject}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 transition-colors text-sm whitespace-nowrap shadow-md"
                aria-label={content.accept}
              >
                {content.accept}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
