'use client'

import { Loader2, AlertCircle, Download, Eye, RefreshCw, QrCode, BarChart3, MoreVertical, Edit2, Trash2, Store, Lock, Unlock } from 'lucide-react'
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
  is_unlocked?: boolean
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
  const [isUnlocking, setIsUnlocking] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Check if model is in an active processing state
  const isProcessing = model.status === 'processing'
  const isUnlocked = model.is_unlocked === true
  const isCompleted = model.status === 'completed'

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
      const displayName = model.name || `Generation #${model.id.slice(0, 6)}`
      const viewerUrl = `/viewer.html?modelUrl=${encodeURIComponent(model.glb_url)}&name=${encodeURIComponent(displayName)}`
      window.open(viewerUrl, '_blank')
    }
  }

  const handleUnlockModel = async () => {
    setIsUnlocking(true)
    try {
      const response = await fetch('/api/unlock-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: model.id }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (data.code === 'NO_CREDITS') {
          // Redirect to settings page to buy credits
          window.location.href = '/dashboard/settings'
          return
        }
        throw new Error(data.error || 'Failed to unlock model')
      }

      // Refresh data to show unlocked state
      queryClient.invalidateQueries({ queryKey: ['generations'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    } catch (error: any) {
      console.error('Unlock error:', error)
      alert(error.message || 'Failed to unlock model')
    } finally {
      setIsUnlocking(false)
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

      const { error } = await supabase
        .from('generations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', model.id)

      if (error) {
        throw new Error(error.message)
      }

      queryClient.invalidateQueries({ queryKey: ['generations'] })
    } catch (error) {
      console.error('Failed to delete:', error)
      alert(dict.modelCard.failedToDelete)
    }
    setShowMenu(false)
  }

  return (
    <>
      <div className="glass-card-dark border border-[#1e293b]/60 rounded-2xl overflow-hidden hover:border-[#00f0ff]/40 hover:shadow-[0_15px_40px_rgba(0,240,255,0.04)] transition-all duration-300 group flex flex-col justify-between h-full">
        {/* Image / Preview Area */}
        <div className="relative aspect-square bg-[#050a14] overflow-hidden">
          {model.input_image_url && (
            <Image
              src={model.input_image_url}
              alt="Model Input"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isProcessing}
              className={`object-cover transition-all duration-700 group-hover:scale-105 ${
                isProcessing ? 'opacity-40 blur-sm' : 'opacity-100'
              }`}
            />
          )}

          {/* Status Overlays */}
          {(isProcessing || isRetrying) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center">
              <Loader2 className="w-8 h-8 text-[#00f0ff] animate-spin mb-3" />
              <span className="text-white text-xs font-semibold tracking-wide">
                {isRetrying ? 'Restarting...' : progressMessage}
              </span>
            </div>
          )}

          {model.status === 'failed' && !isRetrying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/30 backdrop-blur-sm p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-red-400 text-xs font-semibold">{dict.modelCard.generationFailed}</span>
            </div>
          )}

          {/* Unlocked badge */}
          {isCompleted && isUnlocked && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="flex items-center gap-1 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg">
                <Unlock size={10} />
                {dict.modelCard.ready}
              </span>
            </div>
          )}

          {/* Locked badge */}
          {isCompleted && !isUnlocked && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg">
                <Lock size={10} />
                {dict.modelCard.locked || 'Locked'}
              </span>
            </div>
          )}
        </div>

        {/* Info / Actions */}
        <div className="p-5 flex-1 flex flex-col justify-between">
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
                  className="w-full bg-[#0a0f1c] border border-[#00f0ff] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                />
              ) : (
                <h3 className="font-display font-bold text-slate-200 text-sm truncate" title={model.name || `Generation #${model.id.slice(0, 6)}`}>
                  {model.name || `Generation #${model.id.slice(0, 6)}`}
                </h3>
              )}
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">
                {new Date(model.created_at).toLocaleDateString()}
              </p>
              {shopifySyncStatus && (
                <div className="mt-2">
                  <ShopifyStatusBadge status={shopifySyncStatus} />
                </div>
              )}
            </div>

            {/* Three-dots menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e293b]/60 border border-transparent hover:border-slate-800 rounded-lg transition-colors"
                aria-label="More actions"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-[#0b0f19] border border-[#1e293b]/80 rounded-xl shadow-2xl z-20 min-w-[160px] overflow-hidden">
                  <button
                    onClick={() => {
                      setIsEditingName(true)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#121a2f] hover:text-white transition-colors"
                  >
                    <Edit2 size={12} className="text-slate-400" />
                    {dict.modelCard.editName}
                  </button>
                  {isCompleted && isUnlocked && (
                    <button
                      onClick={() => {
                        setShowShopifyPicker(true)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#121a2f] hover:text-white transition-colors"
                    >
                      <Store size={12} className="text-slate-400" />
                      {dict.shopify?.pushToShopify || 'Push to Shopify'}
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={12} />
                    {dict.modelCard.delete}
                  </button>
                </div>
              )}
            </div>
          </div>

          {isCompleted ? (
            isUnlocked ? (
              /* ===== UNLOCKED MODEL: Full actions ===== */
              <div className="space-y-3">
                {/* Primary Action - View in AR */}
                <button
                  onClick={handleViewInAR}
                  className="glow-btn w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-[#050a14] text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-[#00f0ff]/10 hover:shadow-[#00f0ff]/20"
                >
                  <Eye size={14} /> {dict.modelCard.viewInAR}
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="flex flex-col items-center justify-center gap-1.5 bg-[#12192c]/65 border border-[#1e293b]/60 hover:bg-[#1a2542]/80 text-slate-300 hover:text-white text-[10px] font-semibold py-2.5 rounded-xl transition-colors"
                    title="Generate QR Code"
                  >
                    <QrCode size={14} className="text-[#00f0ff]" />
                    <span>QR</span>
                  </button>
                  <button
                    onClick={() => setShowAnalyticsModal(true)}
                    className="flex flex-col items-center justify-center gap-1.5 bg-[#12192c]/65 border border-[#1e293b]/60 hover:bg-[#1a2542]/80 text-slate-300 hover:text-white text-[10px] font-semibold py-2.5 rounded-xl transition-colors"
                    title="View Analytics"
                  >
                    <BarChart3 size={14} className="text-[#00f0ff]" />
                    <span>Stats</span>
                  </button>
                  <button
                    onClick={() => window.open(model.glb_url!, '_blank')}
                    className="flex flex-col items-center justify-center gap-1.5 bg-[#12192c]/65 border border-[#1e293b]/60 hover:bg-[#1a2542]/80 text-slate-300 hover:text-white text-[10px] font-semibold py-2.5 rounded-xl transition-colors"
                    title="Download GLB"
                  >
                    <Download size={14} className="text-[#00f0ff]" />
                    <span>GLB</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ===== LOCKED MODEL: Show unlock CTA ===== */
              <div className="space-y-3">
                {/* Preview button — user can see the model but it's not shareable */}
                <button
                  onClick={handleViewInAR}
                  className="w-full flex items-center justify-center gap-2 bg-[#12192c]/80 hover:bg-[#1b2640] text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all border border-[#1e293b]/60"
                >
                  <Eye size={14} /> {dict.modelCard.preview || 'Preview'}
                </button>

                {/* Unlock CTA */}
                <button
                  onClick={handleUnlockModel}
                  disabled={isUnlocking}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Unlock size={14} />
                      {dict.modelCard.unlockModel || 'Unlock for $5'}
                    </>
                  )}
                </button>

                {/* Locked features hint */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-bold tracking-wider pt-1 uppercase">
                  <span className="flex items-center gap-1"><QrCode size={11} /> QR</span>
                  <span className="flex items-center gap-1"><Download size={11} /> GLB</span>
                  <span className="flex items-center gap-1"><BarChart3 size={11} /> Stats</span>
                </div>
              </div>
            )
          ) : model.status === 'failed' ? (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-red-950/20 hover:bg-red-950/30 text-red-400 hover:text-red-300 py-3.5 rounded-xl border border-red-900/40 hover:border-red-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex items-center justify-center text-xs text-slate-400 italic bg-[#1e293b]/20 py-3 rounded-xl border border-dashed border-[#1e293b]/40">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
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
