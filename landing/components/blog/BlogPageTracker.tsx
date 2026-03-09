'use client'

import { useEffect } from 'react'
import { trackPageView } from '@/utils/track'

interface BlogPageTrackerProps {
  slug: string
  title: string
}

export default function BlogPageTracker({ slug, title }: BlogPageTrackerProps) {
  useEffect(() => {
    trackPageView(`blog/${slug}`, { title })
  }, [slug, title])

  return null
}
