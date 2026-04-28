'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from '@/utils/cookie-consent';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check initial consent
    setConsentGiven(hasAnalyticsConsent());

    // Listen for consent changes (fired by CookieBanner)
    const handleConsentUpdate = () => {
      setConsentGiven(hasAnalyticsConsent());
    };

    window.addEventListener('consentUpdated', handleConsentUpdate);
    return () => window.removeEventListener('consentUpdated', handleConsentUpdate);
  }, []);

  if (!GA_MEASUREMENT_ID || !consentGiven) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
