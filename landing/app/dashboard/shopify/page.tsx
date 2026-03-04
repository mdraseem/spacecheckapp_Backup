'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, Suspense } from 'react'
import { Store, Search, Box, ArrowRight, ExternalLink, CheckCircle, X, Unplug, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

export const dynamic = 'force-dynamic'

interface ShopifyProduct {
  id: string
  title: string
  handle: string
  status: string
  featuredImage: { url: string; altText: string | null } | null
  images: { nodes: { id: string; url: string; altText: string | null }[] }
  media: {
    nodes: {
      mediaContentType: string
      id?: string
      sources?: { url: string; format: string }[]
    }[]
  }
  variants: { nodes: { id: string; price: string }[] }
}

export default function ShopifyPage() {
  const { dict } = useDashboardLanguage()
  const searchParams = useSearchParams()
  const justConnected = searchParams.get('connected') === 'true'
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccess, setShowSuccess] = useState(justConnected)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shopify-products', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      const res = await fetch(`/api/shopify/products?${params.toString()}`)
      if (res.status === 404) {
        return { notConnected: true }
      }
      if (!res.ok) {
        throw new Error('Failed to load products')
      }
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  // Not connected state
  if (data?.notConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-24 h-24 bg-[#1e293b] rounded-full flex items-center justify-center mb-6">
          <Store className="w-12 h-12 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {dict.shopify?.notConnected || 'No Shopify store connected'}
        </h2>
        <p className="text-slate-400 mb-8 max-w-md">
          {dict.shopify?.notConnectedDesc || 'Connect your Shopify store to browse products and push 3D models directly to your product pages.'}
        </p>
        <Link
          href="/connect"
          className="flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors uppercase tracking-wide"
        >
          <Store size={20} />
          {dict.shopify?.connectStore || 'Connect Store'}
        </Link>
      </div>
    )
  }

  const products: ShopifyProduct[] = data?.products || []
  const has3DModel = (product: ShopifyProduct) =>
    product.media.nodes.some((m) => m.mediaContentType === 'MODEL_3D')

  return (
    <div>
      {/* Success banner */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-green-400 font-semibold">
                {dict.shopify?.connected || 'Shopify store connected!'}
              </p>
              <p className="text-green-400/80 text-sm">
                {dict.shopify?.connectedDesc || 'You can now browse products and push 3D models.'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowSuccess(false)} className="text-green-400 hover:text-green-300">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Store className="text-[#00f0ff]" size={28} />
            {dict.shopify?.title || 'Shopify Products'}
          </h1>
          <p className="text-slate-400 mt-1">
            {data?.shopDomain && (
              <span className="text-[#00f0ff]/80">{data.shopDomain}</span>
            )}
            {' '}{dict.shopify?.subtitle || '— Select a product to generate a 3D model from its image.'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={dict.shopify?.searchPlaceholder || 'Search products...'}
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[4/5] bg-[#0f172a] rounded-xl animate-pulse border border-[#1e293b]" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Failed to load products from Shopify.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-[#1e293b] text-slate-300 rounded-lg hover:text-white transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Products grid */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {searchQuery
              ? (dict.shopify?.noResults || 'No products found matching your search.')
              : (dict.shopify?.noProducts || 'No products in your store yet.')}
          </p>
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ShopifyProductCard
              key={product.id}
              product={product}
              has3D={has3DModel(product)}
              dict={dict}
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {data?.pageInfo?.hasNextPage && (
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            {dict.shopify?.moreProducts || 'Showing first 24 products. Use search to find specific products.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ShopifyProductCard({
  product,
  has3D,
  dict,
}: {
  product: ShopifyProduct
  has3D: boolean
  dict: any
}) {
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    product.featuredImage?.url || product.images.nodes[0]?.url || ''
  )

  const price = product.variants.nodes[0]?.price
  const images = product.images.nodes

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden hover:border-[#00f0ff]/30 transition-all group">
      {/* Product image */}
      <div className="relative aspect-square bg-[#050a14] overflow-hidden">
        {selectedImageUrl ? (
          <Image
            src={selectedImageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-12 h-12 text-slate-600" />
          </div>
        )}

        {/* 3D badge */}
        {has3D && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Box size={12} />
              3D
            </span>
          </div>
        )}

        {/* Status */}
        {product.status !== 'ACTIVE' && (
          <div className="absolute top-2 left-2">
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded">
              {product.status}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-slate-200 text-sm truncate mb-1" title={product.title}>
          {product.title}
        </h3>
        {price && (
          <p className="text-xs text-slate-500 mb-3">${price}</p>
        )}

        {/* Image selector (if multiple images) */}
        {images.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {images.slice(0, 5).map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageUrl(img.url)}
                className={`w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImageUrl === img.url
                    ? 'border-[#00f0ff]'
                    : 'border-[#1e293b] hover:border-slate-600'
                }`}
              >
                <Image src={img.url} alt="" width={40} height={40} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Generate 3D button */}
        <Link
          href={`/dashboard/create?shopify_product_id=${encodeURIComponent(product.id)}&shopify_product_title=${encodeURIComponent(product.title)}&shopify_image_url=${encodeURIComponent(selectedImageUrl)}`}
          className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] text-sm font-bold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
        >
          <Box size={16} />
          {dict.shopify?.generate3D || 'Generate 3D Model'}
        </Link>
      </div>
    </div>
  )
}
