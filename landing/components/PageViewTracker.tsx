'use client';

import { useEffect } from 'react';
import { trackPageView } from '@/utils/track';

interface PageViewTrackerProps {
  page: string;
  lang: string;
  metadata?: Record<string, any>;
}

/**
 * Tracks page views on mount
 */
export default function PageViewTracker({ page, lang, metadata = {} }: PageViewTrackerProps) {
  useEffect(() => {
    trackPageView(page, {
      lang,
      ...metadata,
    });
  }, [page, lang, metadata]);

  return null; // This component doesn't render anything
}
