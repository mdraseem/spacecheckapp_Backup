/**
 * Cookie Consent Management Utility
 * GDPR Compliant - Manages user consent for analytics cookies
 */

const CONSENT_KEY = 'spacecheck_cookie_consent';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

export interface CookieConsent {
  status: ConsentStatus;
  timestamp: number;
  version: string; // Privacy policy version
}

/**
 * Get current consent status
 */
export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as CookieConsent;
  } catch {
    return null;
  }
}

/**
 * Set consent status
 */
export function setConsent(status: ConsentStatus): void {
  if (typeof window === 'undefined') return;

  const consent: CookieConsent = {
    status,
    timestamp: Date.now(),
    version: '1.0', // Update this when privacy policy changes
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

  // Trigger custom event for other components to react
  window.dispatchEvent(new CustomEvent('consentUpdated', { detail: consent }));
}

/**
 * Check if user has given consent for analytics
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent?.status === 'accepted';
}

/**
 * Check if consent banner should be shown
 */
export function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false;

  const consent = getConsent();
  return consent === null;
}

/**
 * Clear consent (for testing or privacy policy updates)
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_KEY);
}
