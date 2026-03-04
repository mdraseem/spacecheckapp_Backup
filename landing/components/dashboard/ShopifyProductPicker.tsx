'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Store, Loader2, Box, Check } from 'lucide-react'
import Image from 'next/image'

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  featuredImage: { url: string; altText: string | null } | null
  variants: { nodes: { id: string; price: string }[] }
  media: {
    nodes: {
      mediaContentType: string
    }[]
  }
}

interface ShopifyProductPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (productId: string, productTitle: string) => void
  isUploading?: boolean
}

export function ShopifyProductPicker({
  isOpen,
  onClose,
  onSelect,
  isUploading,
}: ShopifyProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedProductTitle, setSelectedProductTitle] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['shopify-products-picker', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      const res = await fetch(`/api/shopify/products?${params.toString()}`)
      if (res.status === 404) return { notConnected: true }
      if (!res.ok) throw new Error('Failed to load products')
      return res.json()
    },
    enabled: isOpen,
    refetchOnWindowFocus: false,
  })

  if (!isOpen) return null

  const products: ShopifyProduct[] = data?.products || []

  const handleConfirm = () => {
    if (selectedProductId) {
      onSelect(selectedProductId, selectedProductTitle)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#0f172a] border border-[#1e293b] rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Store size={20} className="text-[#00f0ff]" />
              Push to Shopify
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Select a product to attach the 3D model to
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#1e293b]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] transition-colors text-sm"
            />
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {data?.notConnected && (
            <div className="text-center py-8">
              <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No Shopify store connected.</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading products...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">Failed to load products</p>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && !data?.notConnected && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">
                {searchQuery ? 'No products match your search.' : 'No products found.'}
              </p>
            </div>
          )}

          {products.map((product) => {
            const isSelected = selectedProductId === product.id
            const has3D = product.media.nodes.some(
              (m) => m.mediaContentType === 'MODEL_3D'
            )

            return (
              <button
                key={product.id}
                onClick={() => {
                  setSelectedProductId(product.id)
                  setSelectedProductTitle(product.title)
                }}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-[#00f0ff] bg-[#00f0ff]/5'
                    : 'border-[#1e293b] hover:border-slate-600 bg-[#0a0f1c]'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1e293b] flex-shrink-0">
                  {product.featuredImage?.url ? (
                    <Image
                      src={product.featuredImage.url}
                      alt={product.title}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Box className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.variants.nodes[0]?.price && (
                      <span className="text-xs text-slate-500">
                        ${product.variants.nodes[0].price}
                      </span>
                    )}
                    {has3D && (
                      <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                        Has 3D
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                    isSelected
                      ? 'border-[#00f0ff] bg-[#00f0ff]'
                      : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check size={14} className="text-[#050a14]" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e293b] flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProductId || isUploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading to Shopify...
              </>
            ) : (
              <>
                <Store size={16} />
                Push to Shopify
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
