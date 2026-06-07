'use client';

import { hasAnalyticsConsent } from './cookie-consent';

/**
 * Client-side analytics tracking helper
 * Respects GDPR cookie consent
 */

export type LandingEvent =
  // Page views
  | 'page_view'
  | 'hero_view'

  // CTA interactions
  | 'cta_start_free_clicked'
  | 'cta_view_demo_clicked'
  | 'cta_contact_clicked'
  | 'pricing_cta_clicked'
  | 'shopify_app_store_clicked'

  // Feature exploration
  | 'feature_card_viewed'
  | 'how_it_works_viewed'
  | 'demo_section_viewed'
  | 'pricing_section_viewed'
  | 'faq_section_viewed'

  // Conversions
  | 'signup_initiated'
  | 'signup_completed'
  | 'checkout_initiated'
  | 'checkout_completed'
  | 'subscription_activated'

  // Engagement
  | '3d_model_interacted'
  | 'qr_code_viewed'
  | 'video_played'
  | 'faq_item_expanded';

interface TrackingMetadata {
  page?: string;
  section?: string;
  cta_text?: string;
  plan_type?: string;
  price_id?: string;
  [key: string]: any;
}

/**
 * Track a landing page event
 */
export async function trackLandingEvent(
  event: LandingEvent,
  metadata: TrackingMetadata = {}
): Promise<void> {
  // Check cookie consent
  if (!hasAnalyticsConsent()) {
    console.log('📊 Analytics disabled - no consent');
    return;
  }

  try {
    const payload = {
      event,
      user_id: getOrCreateUserId(),
      model_name: null, // Landing page events don't have model
      timestamp: new Date().toISOString(),
      metadata: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        language: typeof navigator !== 'undefined' ? navigator.language : '',
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        ...metadata,
      },
    };

    console.log('📊 Tracking:', event, metadata);

    const response = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Analytics tracking failed:', response.statusText);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * Track page view (call on each page load)
 */
export function trackPageView(page: string, metadata: TrackingMetadata = {}): void {
  trackLandingEvent('page_view', {
    page,
    ...metadata,
  });
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaText: string, destination: string, metadata: TrackingMetadata = {}): void {
  trackLandingEvent('cta_start_free_clicked', {
    cta_text: ctaText,
    destination,
    ...metadata,
  });
}

/**
 * Track conversion events
 */
export function trackConversion(event: 'signup' | 'checkout' | 'subscription', status: 'initiated' | 'completed', metadata: TrackingMetadata = {}): void {
  const eventMap = {
    signup_initiated: 'signup_initiated',
    signup_completed: 'signup_completed',
    checkout_initiated: 'checkout_initiated',
    checkout_completed: 'checkout_completed',
    subscription_initiated: 'checkout_initiated', // Same as checkout
    subscription_completed: 'subscription_activated',
  } as const;

  const eventKey = `${event}_${status}` as keyof typeof eventMap;
  const eventName = eventMap[eventKey] as LandingEvent;

  trackLandingEvent(eventName, metadata);
}

/**
 * Get or create anonymous user ID for tracking
 */
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'server';

  const STORAGE_KEY = 'spacecheck_user_id';

  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    userId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

/**
 * Track section visibility (use with Intersection Observer)
 */
export function useSectionTracking(
  sectionName: string,
  event: LandingEvent = 'feature_card_viewed'
) {
  if (typeof window === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackLandingEvent(event, { section: sectionName });
          observer.disconnect(); // Track only once
        }
      });
    },
    { threshold: 0.5 } // 50% visible
  );

  return observer;
}
