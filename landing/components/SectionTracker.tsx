'use client';

import { useEffect, useRef } from 'react';
import { trackLandingEvent, LandingEvent } from '@/utils/track';

interface SectionTrackerProps {
  sectionName: string;
  event?: LandingEvent;
  metadata?: Record<string, any>;
  children: React.ReactNode;
}

/**
 * Wrapper component that tracks when a section becomes visible
 */
export default function SectionTracker({
  sectionName,
  event = 'feature_card_viewed',
  metadata = {},
  children,
}: SectionTrackerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || trackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !trackedRef.current) {
            trackLandingEvent(event, {
              section: sectionName,
              ...metadata,
            });
            trackedRef.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 } // Track when 30% visible
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [sectionName, event, metadata]);

  return <div ref={ref}>{children}</div>;
}
