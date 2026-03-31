'use client'

import { Loader2, AlertCircle, Download, Eye, RefreshCw, QrCode, BarChart3, MoreVertical, Edit2, Trash2, Store, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { retryGeneration, deleteGeneration } from '@/app/dashboard/actions'
import { useState, useRef, useEffect } from 'react'
import { QRCodeModal } from './QRCodeModal'
import { ModelAnalyticsModal } from './ModelAnalyticsModal'
import { ShopifyProductPicker } from './ShopifyProductPicker'
import { ShopifyStatusBadge } from './ShopifyStatusBadge'
import { useQueryClient } from '@tanstack/react-query'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'

interface Generation {
  id: string
  status: 'processing' | 'completed' | 'failed'
  input_image_url: string
  glb_url: string | null
  usdz_url: string | null
  created_at: string
  name?: string
  width_cm?: number | null
  height_cm?: number | null
  depth_cm?: number | null
  is_public?: boolean
  archived_at?: string | null
}

export function ModelCard({ model }: { model: Generation }) {
  const { dict } = useDashboardLanguage()
  const queryClient = useQueryClient()
  const [isRetrying, setIsRetrying] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showShopifyPicker, setShowShopifyPicker] = useState(false)
  const [isShopifyUploading, setIsShopifyUploading] = useState(false)
  const [shopifySyncStatus, setShopifySyncStatus] = useState<'uploading' | 'processing' | 'completed' | 'failed' | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(model.name || '')
  const menuRef = useRef<HTMLDivElement>(null)

  // Check if model is in an active processing state
  const isProcessing = model.status === 'processing'

  const progressMessage = dict.modelCard.generatingModel

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await retryGeneration(model.id)
    } catch (error) {
      console.error('Retry failed:', error)
      alert('Failed to retry generation. Please try again.')
      setIsRetrying(false)
    }
  }

  const handleViewInAR = () => {
    if (model.glb_url) {
      // Use full URL for dashboard models
      const displayName = model.name || `Generation #${model.id.slice(0, 6)}`
      const viewerUrl = `/viewer.html?modelUrl=${encodeURIComponent(model.glb_url)}&name=${encodeURIComponent(displayName)}`
      window.open(viewerUrl, '_blank')
    }
  }

  const handlePushToShopify = async (shopifyProductId: string, productTitle: string) => {
    setIsShopifyUploading(true)
    setShopifySyncStatus('uploading')
    try {
      const res = await fetch('/api/shopify/push-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: model.id,
          shopifyProductId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to push to Shopify')
      }

      const data = await res.json()
      setShopifySyncStatus(data.status === 'READY' ? 'completed' : 'processing')
      setShowShopifyPicker(false)
    } catch (error: any) {
      console.error('Shopify push failed:', error)
      setShopifySyncStatus('failed')
      alert(error.message || 'Failed to push model to Shopify')
    } finally {
      setIsShopifyUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== model.name) {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()

        const { error } = await supabase
          .from('generations')
          .update({ name: editedName.trim() })
          .eq('id', model.id)

        if (error) throw error

        // Refresh the page to show updated name
        window.location.reload()
      } catch (error) {
        console.error('Failed to update name:', error)
        alert('Failed to update name')
      }
    }
    setIsEditingName(false)
  }

  const handleDelete = async () => {
    const displayName = model.name || `Generation #${model.id.slice(0, 6)}`
    if (!confirm(`${dict.modelCard.deleteConfirm} "${displayName}"?`)) {
      return
    }

    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // Soft-delete: mark as deleted instead of removing the row,
      // so it still counts toward monthly usage limits.
      const { error } = await supabase
        .from('generations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', model.id)

      if (error) {
        throw new Error(error.message)
      }

      // Invalidate and refetch the generations query
      queryClient.invalidateQueries({ queryKey: ['generations'] })
    } catch (error) {
      console.error('Failed to delete:', error)
      alert(dict.modelCard.failedToDelete)
    }
    setShowMenu(false)
  }

  return (
    <>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden hover:border-[#00f0ff]/30 transition-all group">
        {/* Image / Preview Area */}
        <div className="relative aspect-square bg-[#050a14] overflow-hidden">
          {model.input_image_url && (
            <Image
              src={model.input_image_url}
              alt="Model Input"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isProcessing}
              className={`object-cover transition-opacity duration-500 ${
                isProcessing ? 'opacity-50' : 'opacity-100'
              }`}
            />
          )}

          {/* Status Overlays */}
          {(isProcessing || isRetrying) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin mb-3" />
              <span className="text-white text-sm font-medium">
                {isRetrying ? 'Restarting generation...' : progressMessage}
              </span>
            </div>
          )}

          {model.status === 'failed' && !isRetrying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-sm">
              <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
              <span className="text-red-400 text-sm font-medium">{dict.modelCard.generationFailed}</span>
            </div>
          )}

          {model.status === 'completed' && model.is_public !== false && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-[#00f0ff] text-[#050a14] text-xs font-bold px-2 py-1 rounded">{dict.modelCard.ready}</span>
            </div>
          )}

          {/* Archived / Hosting Paused badge */}
          {model.status === 'completed' && model.is_public === false && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 bg-orange-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                <EyeOff size={12} />
                {dict.modelCard.arPaused || 'AR Paused'}
              </span>
            </div>
          )}
        </div>

        {/* Info / Actions */}
        <div className="p-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setIsEditingName(false)
                      setEditedName(model.name || '')
                    }
                  }}
                  autoFocus
                  className="w-full bg-[#0a0f1c] border border-[#00f0ff] rounded px-2 py-1 text-slate-200 text-sm focus:outline-none"
                />
              ) : (
                <h3 className="font-medium text-slate-200 text-sm truncate" title={model.name || `Generation #${model.id.slice(0, 6)}`}>
                  {model.name || `Generation #${model.id.slice(0, 6)}`}
                </h3>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {new Date(model.created_at).toLocaleDateString()}
              </p>
              {shopifySyncStatus && (
                <div className="mt-1.5">
                  <ShopifyStatusBadge status={shopifySyncStatus} />
                </div>
              )}
            </div>

            {/* Three-dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded transition-colors"
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden">
                  <button
                    onClick={() => {
                      setIsEditingName(true)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                    {dict.modelCard.editName}
                  </button>
                  {model.status === 'completed' && (
                    <button
                      onClick={() => {
                        setShowShopifyPicker(true)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors"
                    >
                      <Store size={14} />
                      {dict.shopify?.pushToShopify || 'Push to Shopify'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} />
                    {dict.modelCard.delete}
                  </button>
                </div>
              )}
            </div>
          </div>

          {model.status === 'completed' ? (
            <div className="space-y-2">
              {/* Primary Action - View in AR */}
              <button
                onClick={handleViewInAR}
                className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] text-sm font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
              >
                <Eye size={16} /> {dict.modelCard.viewInAR}
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex flex-col items-center justify-center gap-1 bg-[#1e293b] hover:bg-[#2d3b55] text-slate-300 hover:text-white text-xs py-2 rounded-lg transition-colors"
                  title="Generate QR Code"
                >
                  <QrCode size={16} />
                  <span>QR</span>
                </button>
                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  className="flex flex-col items-center justify-center gap-1 bg-[#1e293b] hover:bg-[#2d3b55] text-slate-300 hover:text-white text-xs py-2 rounded-lg transition-colors"
                  title="View Analytics"
                >
                  <BarChart3 size={16} />
                  <span>Stats</span>
                </button>
                <button
                  onClick={() => window.open(model.glb_url!, '_blank')}
                  className="flex flex-col items-center justify-center gap-1 bg-[#1e293b] hover:bg-[#2d3b55] text-slate-300 hover:text-white text-xs py-2 rounded-lg transition-colors"
                  title="Download GLB"
                >
                  <Download size={16} />
                  <span>GLB</span>
                </button>
              </div>
            </div>
          ) : model.status === 'failed' ? (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 py-3 rounded-lg border border-red-800/50 hover:border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {dict.modelCard.retryGeneration}
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-center text-xs text-slate-400 italic bg-[#1e293b]/50 py-3 rounded-lg border border-dashed border-[#1e293b]">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {dict.modelCard.processing}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {model.glb_url && (
        <>
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            modelUrl={model.glb_url}
            modelName={model.name || `Generation #${model.id.slice(0, 6)}`}
          />
          <ModelAnalyticsModal
            isOpen={showAnalyticsModal}
            onClose={() => setShowAnalyticsModal(false)}
            modelUrl={model.glb_url}
            modelName={model.name || `Generation #${model.id.slice(0, 6)}`}
          />
          <ShopifyProductPicker
            isOpen={showShopifyPicker}
            onClose={() => setShowShopifyPicker(false)}
            onSelect={handlePushToShopify}
            isUploading={isShopifyUploading}
          />
        </>
      )}
    </>
  )
}
