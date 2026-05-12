'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, Suspense } from 'react'
import { Store, Search, Box, CheckCircle, X, Image as ImageIcon, RefreshCw, CheckSquare, Square, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'
import { bulkCreateGenerationsFromShopify } from '../actions'

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
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-[4/5] bg-[#0f172a] rounded-xl animate-pulse border border-[#1e293b]" />
        ))}
      </div>
    }>
      <ShopifyPageContent />
    </Suspense>
  )
}

function ShopifyPageContent() {
  const { dict } = useDashboardLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const justConnected = searchParams.get('connected') === 'true'
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuccess, setShowSuccess] = useState(justConnected)

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // Per-product image URL overrides (when user picks a different image in bulk mode)
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({})
  // Bulk dimensions modal
  const [showBulkModal, setShowBulkModal] = useState(false)

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(products.map((p) => p.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedIds(new Set())
    setSelectedImages({})
  }

  const getImageForProduct = (product: ShopifyProduct) => {
    return selectedImages[product.id] || product.featuredImage?.url || product.images.nodes[0]?.url || ''
  }

  const handleBulkGenerate = () => {
    if (selectedIds.size === 0) return
    setShowBulkModal(true)
  }

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
        {/* Bulk mode toggle */}
        {!isLoading && !error && products.length > 0 && (
          <div>
            {bulkMode ? (
              <button
                onClick={exitBulkMode}
                className="px-4 py-2 bg-[#1e293b] text-slate-300 hover:text-white border border-[#1e293b] hover:border-slate-600 rounded-lg transition-all text-sm font-medium"
              >
                {dict.shopify?.bulkCancel || 'Cancel'}
              </button>
            ) : (
              <button
                onClick={() => setBulkMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-slate-300 hover:text-white border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-lg transition-all text-sm font-medium"
              >
                <CheckSquare size={16} />
                {dict.shopify?.bulkSelect || 'Select'}
              </button>
            )}
          </div>
        )}
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

      {/* Bulk select all / deselect all */}
      {bulkMode && products.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={selectedIds.size === products.length ? deselectAll : selectAll}
            className="text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors font-medium"
          >
            {selectedIds.size === products.length
              ? (dict.shopify?.bulkDeselectAll || 'Deselect all')
              : (dict.shopify?.bulkSelectAll || 'Select all')}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-sm text-slate-400">
              {selectedIds.size} {dict.shopify?.bulkSelected || 'selected'}
            </span>
          )}
        </div>
      )}

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
              bulkMode={bulkMode}
              isSelected={selectedIds.has(product.id)}
              onToggleSelect={() => toggleSelect(product.id)}
              onImageSelect={(url) =>
                setSelectedImages((prev) => ({ ...prev, [product.id]: url }))
              }
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

      {/* Floating bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 px-6 py-3 bg-[#0f172a] border border-[#00f0ff]/30 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            <span className="text-white font-medium text-sm whitespace-nowrap">
              {selectedIds.size} {dict.shopify?.bulkSelected || 'selected'}
            </span>
            <button
              onClick={handleBulkGenerate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-all text-sm whitespace-nowrap"
            >
              <Box size={16} />
              {dict.shopify?.bulkGenerate || 'Generate 3D Models'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk dimensions modal */}
      {showBulkModal && (
        <BulkDimensionsModal
          products={products.filter((p) => selectedIds.has(p.id))}
          getImageUrl={getImageForProduct}
          dict={dict}
          onClose={() => setShowBulkModal(false)}
          onComplete={() => {
            setShowBulkModal(false)
            exitBulkMode()
            router.push('/dashboard')
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ShopifyProductCard({
  product,
  has3D,
  dict,
  bulkMode,
  isSelected,
  onToggleSelect,
  onImageSelect,
}: {
  product: ShopifyProduct
  has3D: boolean
  dict: any
  bulkMode: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onImageSelect: (url: string) => void
}) {
  const [selectedImageUrl, setSelectedImageUrl] = useState(
    product.featuredImage?.url || product.images.nodes[0]?.url || ''
  )

  const price = product.variants.nodes[0]?.price
  const images = product.images.nodes

  const handleImageSelect = (url: string) => {
    setSelectedImageUrl(url)
    onImageSelect(url)
  }

  return (
    <div
      className={`bg-[#0f172a] border rounded-xl overflow-hidden transition-all group relative ${
        bulkMode && isSelected
          ? 'border-[#00f0ff] ring-1 ring-[#00f0ff]/30'
          : 'border-[#1e293b] hover:border-[#00f0ff]/30'
      } ${bulkMode ? 'cursor-pointer' : ''}`}
      onClick={bulkMode ? onToggleSelect : undefined}
    >
      {/* Checkbox overlay in bulk mode */}
      {bulkMode && (
        <div className="absolute top-3 left-3 z-10">
          {isSelected ? (
            <div className="w-6 h-6 bg-[#00f0ff] rounded-md flex items-center justify-center">
              <CheckSquare size={16} className="text-[#050a14]" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-[#0f172a]/80 border border-[#1e293b] rounded-md flex items-center justify-center">
              <Square size={16} className="text-slate-500" />
            </div>
          )}
        </div>
      )}

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
          <div className={`absolute top-2 ${bulkMode ? 'left-11' : 'left-2'}`}>
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

        {/* Image selector (if multiple images) — clickable even in bulk mode */}
        {images.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" onClick={(e) => e.stopPropagation()}>
            {images.slice(0, 5).map((img) => (
              <button
                key={img.id}
                onClick={() => handleImageSelect(img.url)}
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

        {/* Generate / Regenerate 3D button — hidden in bulk mode */}
        {!bulkMode && (
          <>
            {has3D ? (
              <>
                <div className="flex items-center gap-1.5 mb-2 text-xs text-green-400">
                  <CheckCircle size={12} />
                  {dict.shopify?.has3DModel || '3D model on Shopify'}
                </div>
                <Link
                  href={`/dashboard/create?shopify_product_id=${encodeURIComponent(product.id)}&shopify_product_title=${encodeURIComponent(product.title)}&shopify_image_url=${encodeURIComponent(selectedImageUrl)}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#1e293b]/80 text-slate-300 hover:text-white border border-[#1e293b] hover:border-[#00f0ff]/30 text-sm font-medium py-2.5 rounded-lg transition-all"
                >
                  <RefreshCw size={14} />
                  {dict.shopify?.regenerate3D || 'Regenerate 3D Model'}
                </Link>
              </>
            ) : (
              <Link
                href={`/dashboard/create?shopify_product_id=${encodeURIComponent(product.id)}&shopify_product_title=${encodeURIComponent(product.title)}&shopify_image_url=${encodeURIComponent(selectedImageUrl)}`}
                className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] text-sm font-bold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                <Box size={16} />
                {dict.shopify?.generate3D || 'Generate 3D Model'}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bulk Dimensions Modal
// ---------------------------------------------------------------------------

interface ProductDimensions {
  width: string
  height: string
  depth: string
}

function BulkDimensionsModal({
  products,
  getImageUrl,
  dict,
  onClose,
  onComplete,
}: {
  products: ShopifyProduct[]
  getImageUrl: (product: ShopifyProduct) => string
  dict: any
  onClose: () => void
  onComplete: () => void
}) {
  // Default dimensions applied to all
  const [defaultDims, setDefaultDims] = useState<ProductDimensions>({
    width: '',
    height: '',
    depth: '',
  })

  // Per-product dimension overrides
  const [perProductDims, setPerProductDims] = useState<Record<string, ProductDimensions>>(() => {
    const init: Record<string, ProductDimensions> = {}
    for (const p of products) {
      init[p.id] = { width: '', height: '', depth: '' }
    }
    return init
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ productName: string; success: boolean; error?: string }[] | null>(null)

  const applyDefaultToAll = () => {
    setPerProductDims((prev) => {
      const next = { ...prev }
      for (const id of Object.keys(next)) {
        next[id] = { ...defaultDims }
      }
      return next
    })
  }

  const updateProductDim = (productId: string, field: keyof ProductDimensions, value: string) => {
    setPerProductDims((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }))
  }

  const allValid = useMemo(() => {
    return products.every((p) => {
      const dims = perProductDims[p.id]
      return dims && parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0 && parseFloat(dims.depth) > 0
    })
  }, [products, perProductDims])

  const handleGenerate = async () => {
    if (!allValid) return
    setIsGenerating(true)
    setError(null)

    try {
      const items = products.map((p) => ({
        shopifyImageUrl: getImageUrl(p),
        dimensions: perProductDims[p.id],
        productName: p.title,
        shopifyProductId: p.id,
      }))

      const result = await bulkCreateGenerationsFromShopify(items)
      setResults(result.results)
      setProgress(products.length)

      // Auto-redirect after short delay
      setTimeout(() => onComplete(), 2000)
    } catch (e: any) {
      setError(e.message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
          <div>
            <h2 className="text-xl font-bold text-white">
              {dict.shopify?.bulkDimensions || 'Set Dimensions'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {products.length} {dict.shopify?.bulkSelected || 'selected'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" disabled={isGenerating}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-semibold text-sm mb-2">
                {dict.shopify?.bulkComplete || 'All generations started!'}
              </p>
              {results.some((r) => !r.success) && (
                <div className="mt-2 space-y-1">
                  {results
                    .filter((r) => !r.success)
                    .map((r, i) => (
                      <p key={i} className="text-red-400 text-xs">
                        {r.productName}: {r.error}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Default dimensions */}
          {!results && (
            <>
              <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {dict.shopify?.bulkDimensionsDesc || 'Enter default dimensions for all selected products. You can adjust individual products below.'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{dict.create?.width || 'Width'} (cm)</label>
                    <input
                      type="number"
                      value={defaultDims.width}
                      onChange={(e) => setDefaultDims((d) => ({ ...d, width: e.target.value }))}
                      placeholder="e.g. 100"
                      step="0.01"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{dict.create?.height || 'Height'} (cm)</label>
                    <input
                      type="number"
                      value={defaultDims.height}
                      onChange={(e) => setDefaultDims((d) => ({ ...d, height: e.target.value }))}
                      placeholder="e.g. 80"
                      step="0.01"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{dict.create?.depth || 'Depth'} (cm)</label>
                    <input
                      type="number"
                      value={defaultDims.depth}
                      onChange={(e) => setDefaultDims((d) => ({ ...d, depth: e.target.value }))}
                      placeholder="e.g. 60"
                      step="0.01"
                      className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
                <button
                  onClick={applyDefaultToAll}
                  disabled={!defaultDims.width || !defaultDims.height || !defaultDims.depth || isGenerating}
                  className="mt-3 px-4 py-1.5 bg-[#1e293b] text-[#00f0ff] text-xs font-medium rounded-lg hover:bg-[#1e293b]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {dict.shopify?.bulkApplyToAll || 'Apply to all'}
                </button>
              </div>

              {/* Per-product dimensions */}
              <div className="space-y-3">
                {products.map((product) => {
                  const dims = perProductDims[product.id]
                  const imageUrl = getImageUrl(product)
                  const isValid = dims && parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0 && parseFloat(dims.depth) > 0

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
                        isValid
                          ? 'bg-[#0a0f1c] border-green-500/20'
                          : 'bg-[#0a0f1c] border-[#1e293b]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#050a14]">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={product.title} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={16} className="text-slate-600" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate" title={product.title}>
                          {product.title}
                        </p>
                      </div>

                      {/* Dimensions inputs */}
                      <div className="flex gap-2 flex-shrink-0">
                        <input
                          type="number"
                          value={dims?.width || ''}
                          onChange={(e) => updateProductDim(product.id, 'width', e.target.value)}
                          placeholder="W"
                          step="0.01"
                          className="w-16 bg-[#0f172a] border border-[#1e293b] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#00f0ff] transition-colors text-center"
                          disabled={isGenerating}
                        />
                        <input
                          type="number"
                          value={dims?.height || ''}
                          onChange={(e) => updateProductDim(product.id, 'height', e.target.value)}
                          placeholder="H"
                          step="0.01"
                          className="w-16 bg-[#0f172a] border border-[#1e293b] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#00f0ff] transition-colors text-center"
                          disabled={isGenerating}
                        />
                        <input
                          type="number"
                          value={dims?.depth || ''}
                          onChange={(e) => updateProductDim(product.id, 'depth', e.target.value)}
                          placeholder="D"
                          step="0.01"
                          className="w-16 bg-[#0f172a] border border-[#1e293b] rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#00f0ff] transition-colors text-center"
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Valid indicator */}
                      {isValid && (
                        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!results && (
          <div className="p-6 border-t border-[#1e293b]">
            <button
              onClick={handleGenerate}
              disabled={!allValid || isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-xl hover:bg-[#00f0ff]/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {dict.shopify?.bulkStarting || 'Starting generation...'}
                </>
              ) : (
                <>
                  <Box size={16} />
                  {dict.shopify?.bulkGenerate || 'Generate 3D Models'} ({products.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
