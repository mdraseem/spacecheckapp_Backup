'use client';

import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from '@/utils/cookie-consent';

/**
 * Client-side wrapper to check analytics consent before tracking
 */
export function useAnalyticsConsent() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check initial consent
    setHasConsent(hasAnalyticsConsent());

    // Listen for consent updates
    const handleConsentUpdate = () => {
      setHasConsent(hasAnalyticsConsent());
    };

    window.addEventListener('consentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('consentUpdated', handleConsentUpdate);
    };
  }, []);

  return hasConsent;
}

/**
 * Track event with consent check
 */
export function trackEventWithConsent(
  eventName: string,
  metadata: Record<string, any> = {}
): void {
  // Only track if user has consented
  if (!hasAnalyticsConsent()) {
    console.log('Analytics disabled - no consent');
    return;
  }

  const payload = {
    event: eventName,
    ...metadata,
    timestamp: Date.now(),
  };

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => console.error('Analytics error:', err));
}
