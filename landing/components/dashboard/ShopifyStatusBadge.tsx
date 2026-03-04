'use client'

import { Store, Check, Loader2, AlertCircle } from 'lucide-react'

interface ShopifyStatusBadgeProps {
  status: 'uploading' | 'processing' | 'completed' | 'failed' | null
  shopDomain?: string
}

export function ShopifyStatusBadge({ status, shopDomain }: ShopifyStatusBadgeProps) {
  if (!status) return null

  const configs = {
    uploading: {
      icon: <Loader2 size={12} className="animate-spin" />,
      text: 'Uploading to Shopify',
      className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    processing: {
      icon: <Loader2 size={12} className="animate-spin" />,
      text: 'Processing on Shopify',
      className: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    completed: {
      icon: <Check size={12} />,
      text: 'On Shopify',
      className: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    failed: {
      icon: <AlertCircle size={12} />,
      text: 'Shopify upload failed',
      className: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
  }

  const config = configs[status]

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${config.className}`}
      title={shopDomain ? `Synced to ${shopDomain}` : undefined}
    >
      <Store size={12} />
      {config.icon}
      {config.text}
    </div>
  )
}
