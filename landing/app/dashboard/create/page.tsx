'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { createGeneration, createGenerationFromShopify } from '../actions'
import { UploadCloud, Loader2, FileIcon, Store } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDashboardLanguage } from '@/contexts/DashboardLanguageContext'
import { UsageBadge } from '@/components/dashboard/UsageBadge'

export const dynamic = 'force-dynamic'

export default function CreatePage() {
  const { dict } = useDashboardLanguage()
  const searchParams = useSearchParams()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Shopify product context (from query params)
  const shopifyProductId = searchParams.get('shopify_product_id')
  const shopifyProductTitle = searchParams.get('shopify_product_title')
  const shopifyImageUrl = searchParams.get('shopify_image_url')
  const isShopifyMode = !!shopifyProductId

  // Product Name State
  const [productName, setProductName] = useState(shopifyProductTitle || '')

  // Pre-fill from Shopify image
  useEffect(() => {
    if (shopifyImageUrl && !previewUrl) {
      setPreviewUrl(shopifyImageUrl)
    }
    if (shopifyProductTitle && !productName) {
      setProductName(shopifyProductTitle)
    }
  }, [shopifyImageUrl, shopifyProductTitle])

  // Unit system state (metric or imperial)
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')

  // Dimensions State (stores the raw input values as user types)
  const [dimensions, setDimensions] = useState({
    width: '',
    height: '',
    depth: ''
  })

  const router = useRouter()
  const supabase = createClient()

  // Conversion functions
  const inchesToCm = (inches: number) => inches * 2.54
  const cmToInches = (cm: number) => cm / 2.54

  // Get dimensions in cm for upload
  const getDimensionsInCm = () => {
    const width = parseFloat(dimensions.width)
    const height = parseFloat(dimensions.height)
    const depth = parseFloat(dimensions.depth)

    if (unitSystem === 'imperial') {
      return {
        width: inchesToCm(width).toString(),
        height: inchesToCm(height).toString(),
        depth: inchesToCm(depth).toString()
      }
    }

    return dimensions
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(selectedFile))
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }, [previewUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0])
    }
  }

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDimensions(prev => ({ ...prev, [name]: value }))
  }

  const toggleUnitSystem = () => {
    setUnitSystem(prev => {
      const newSystem = prev === 'metric' ? 'imperial' : 'metric'

      // Convert existing values when switching units
      const newDimensions = { ...dimensions }
      if (dimensions.width) {
        const width = parseFloat(dimensions.width)
        newDimensions.width = (newSystem === 'imperial' ? cmToInches(width) : inchesToCm(width)).toFixed(2)
      }
      if (dimensions.height) {
        const height = parseFloat(dimensions.height)
        newDimensions.height = (newSystem === 'imperial' ? cmToInches(height) : inchesToCm(height)).toFixed(2)
      }
      if (dimensions.depth) {
        const depth = parseFloat(dimensions.depth)
        newDimensions.depth = (newSystem === 'imperial' ? cmToInches(depth) : inchesToCm(depth)).toFixed(2)
      }

      setDimensions(newDimensions)
      return newSystem
    })
  }

  const handleUpload = async () => {
    // For Shopify mode, we don't need a local file - we use the Shopify image URL
    if (!isShopifyMode && !file) return
    if (!productName.trim()) {
        alert(dict.create.enterProductName)
        return
    }
    if (!dimensions.width || !dimensions.height || !dimensions.depth) {
        alert(dict.create.enterDimensions)
        return
    }

    setIsUploading(true)
    try {
      const dimensionsInCm = getDimensionsInCm()

      if (isShopifyMode && shopifyImageUrl && shopifyProductId) {
        // Shopify mode: server action downloads image & creates generation
        await createGenerationFromShopify(
          shopifyImageUrl,
          dimensionsInCm,
          productName,
          shopifyProductId
        )
      } else {
        // Regular mode: upload file to storage first
        const fileExt = file!.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, file!)

        if (uploadError) throw uploadError

        await createGeneration(filePath, dimensionsInCm, productName)
      }
    } catch (error: any) {
      // Ignore Next.js Redirect errors
      if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) {
        throw error
      }
      console.error('Error uploading:', error)

      // Check if it's a usage limit error
      if (error.message && error.message.includes('limit')) {
        alert(error.message)
      } else {
        alert(dict.create.errorUploading)
      }
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{dict.create.title}</h1>
        <p className="text-slate-400">{dict.create.subtitle}</p>
      </div>

      {/* Usage Badge */}
      <div className="mb-8">
        <UsageBadge />
      </div>

      {/* Shopify context banner */}
      {isShopifyMode && (
        <div className="mb-8 p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00f0ff]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <p className="text-[#00f0ff] font-semibold text-sm">
              Generating for Shopify product
            </p>
            <p className="text-slate-400 text-sm">
              {shopifyProductTitle} — The 3D model will be linked to this product after generation.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Upload */}
        <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[400px] overflow-hidden ${
            isDragging
                ? 'border-[#00f0ff] bg-[#00f0ff]/5'
                : 'border-[#1e293b] bg-[#0f172a]/50 hover:border-[#00f0ff]/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            onChange={handleChange}
            accept="image/*"
            disabled={isUploading}
            />

            {isUploading ? (
            <div className="text-center z-10">
                <Loader2 className="w-16 h-16 text-[#00f0ff] animate-spin mb-4 mx-auto" />
                <p className="text-xl font-medium text-[#00f0ff]">{dict.create.uploadingProcessing}</p>
                <p className="text-slate-400 mt-2">{dict.create.quantumScan}</p>
            </div>
            ) : (file || isShopifyMode) && previewUrl ? (
            <div className="text-center z-10 flex flex-col items-center w-full h-full py-4">
                <div className="relative w-full aspect-square max-w-[300px] mb-6 rounded-xl overflow-hidden border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                />
                </div>
                <div className="pointer-events-none">
                    {file ? (
                      <>
                        <p className="text-lg font-medium text-white mb-1">{file.name}</p>
                        <p className="text-sm text-slate-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : isShopifyMode ? (
                      <p className="text-lg font-medium text-white mb-1 flex items-center gap-2 justify-center">
                        <Store size={16} className="text-[#00f0ff]" />
                        Shopify product image
                      </p>
                    ) : null}
                </div>
                {!isShopifyMode && (
                  <div className="z-30 pointer-events-auto">
                      <button
                      className="px-6 py-2 bg-[#1e293b] text-slate-300 rounded-full text-xs border border-slate-700 hover:border-[#00f0ff]/50 hover:text-[#00f0ff] transition-all"
                      >
                      {dict.create.changeImage}
                      </button>
                  </div>
                )}
            </div>
            ) : (
            <div className="text-center pointer-events-none">
                <div className="w-20 h-20 bg-[#1e293b] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-[#00f0ff]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                {dict.create.dragDrop}
                </h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                {dict.create.supports}
                </p>
                <span className="px-6 py-3 bg-[#00f0ff] text-[#050a14] font-bold rounded-lg hover:bg-[#00f0ff]/90 transition-colors uppercase tracking-wide text-sm">
                {dict.create.browseFiles}
                </span>
            </div>
            )}
        </div>

        {/* Right Col: Dimensions & Actions */}
        <div className="flex flex-col justify-center space-y-6">
            <div className="bg-[#0f172a]/50 p-6 rounded-2xl border border-[#1e293b]">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#00f0ff] rounded-full"></span>
                    {dict.create.productDetails}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{dict.create.productName}</label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder={dict.create.productNamePlaceholder}
                            className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a]/50 p-6 rounded-2xl border border-[#1e293b]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#00f0ff] rounded-full"></span>
                        {dict.create.dimensions}
                    </h3>
                    {/* Unit Toggle */}
                    <button
                        onClick={toggleUnitSystem}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] hover:bg-[#2d3b55] border border-[#00f0ff]/20 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        type="button"
                    >
                        <span className={unitSystem === 'metric' ? 'text-[#00f0ff]' : 'text-slate-500'}>cm</span>
                        <span className="text-slate-600">/</span>
                        <span className={unitSystem === 'imperial' ? 'text-[#00f0ff]' : 'text-slate-500'}>in</span>
                    </button>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                    {dict.create.dimensionsDesc}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {dict.create.width} ({unitSystem === 'metric' ? 'cm' : 'inches'})
                        </label>
                        <input
                            type="number"
                            name="width"
                            value={dimensions.width}
                            onChange={handleDimensionChange}
                            placeholder={unitSystem === 'metric' ? dict.create.widthPlaceholder : 'e.g. 78.7'}
                            step="0.01"
                            className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {dict.create.height} ({unitSystem === 'metric' ? 'cm' : 'inches'})
                        </label>
                        <input
                            type="number"
                            name="height"
                            value={dimensions.height}
                            onChange={handleDimensionChange}
                            placeholder={unitSystem === 'metric' ? dict.create.heightPlaceholder : 'e.g. 33.5'}
                            step="0.01"
                            className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {dict.create.depth} ({unitSystem === 'metric' ? 'cm' : 'inches'})
                        </label>
                        <input
                            type="number"
                            name="depth"
                            value={dimensions.depth}
                            onChange={handleDimensionChange}
                            placeholder={unitSystem === 'metric' ? dict.create.depthPlaceholder : 'e.g. 37.4'}
                            step="0.01"
                            className="w-full bg-[#0a0f1c] border border-[#1e293b] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {(file || isShopifyMode) && (
                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-4 bg-[#00f0ff] text-[#050a14] font-bold rounded-xl hover:bg-[#00f0ff]/90 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {dict.create.processing}
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-5 h-5" />
                            {dict.create.generateAR}
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  )
}