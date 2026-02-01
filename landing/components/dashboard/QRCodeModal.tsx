'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Copy, Check, Code } from 'lucide-react'
import * as QRCode from 'qrcode'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  modelUrl: string
  modelName: string
}

type TabType = 'poster' | 'embed'

export function QRCodeModal({ isOpen, onClose, modelUrl, modelName }: QRCodeModalProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const posterCanvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('poster')
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)

  // Customizable text fields
  const [customName, setCustomName] = useState(modelName)
  const [posterTitle, setPosterTitle] = useState('See it in your room')
  const [posterSubtitle, setPosterSubtitle] = useState('Scan with your phone camera')
  const [posterFooter, setPosterFooter] = useState('AR Visualization')
  const [buttonText, setButtonText] = useState('View in AR')

  // Extract model path from URL (e.g., "kler/bach.glb" from full URL)
  const urlParts = modelUrl.split('/')
  const modelPath = urlParts.slice(-2).join('/')
  const viewerUrl = `${window.location.origin}/viewer.html?model=${encodeURIComponent(modelPath)}&name=${encodeURIComponent(modelName)}`

  // Reset customization when modal opens with new model
  useEffect(() => {
    if (isOpen) {
      setCustomName(modelName)
      setPosterTitle('See it in your room')
      setPosterSubtitle('Scan with your phone camera')
      setPosterFooter('AR Visualization')
      setButtonText('View in AR')
      setQrCodeGenerated(false)
      setCopied(false)
    }
  }, [isOpen, modelName])

  // Generate QR code on canvas
  useEffect(() => {
    if (isOpen && qrCanvasRef.current && modelUrl && !qrCodeGenerated) {
      QRCode.toCanvas(qrCanvasRef.current, viewerUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(() => {
        setQrCodeGenerated(true)
      })
    }
  }, [isOpen, modelUrl, viewerUrl, qrCodeGenerated])

  // Generate marketing poster when QR code is ready or customization changes
  useEffect(() => {
    if (isOpen && posterCanvasRef.current && qrCanvasRef.current && qrCodeGenerated && activeTab === 'poster') {
      generatePoster()
    }
  }, [isOpen, qrCodeGenerated, customName, posterTitle, posterSubtitle, posterFooter, activeTab])

  const generatePoster = () => {
    const canvas = posterCanvasRef.current
    const qrCanvas = qrCanvasRef.current
    if (!canvas || !qrCanvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 600
    const height = 800
    canvas.width = width
    canvas.height = height

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Header gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#1a3a52')
    gradient.addColorStop(1, '#00f0ff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, 20)

    // Title
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1a3a52'
    ctx.font = 'bold 42px -apple-system, sans-serif'
    ctx.fillText(posterTitle, width / 2, 120)

    // Subtitle
    ctx.font = '24px -apple-system, sans-serif'
    ctx.fillStyle = '#666666'
    ctx.fillText(posterSubtitle, width / 2, 160)

    // Arrow
    ctx.beginPath()
    ctx.moveTo(width / 2, 190)
    ctx.lineTo(width / 2, 230)
    ctx.lineTo(width / 2 - 15, 215)
    ctx.moveTo(width / 2, 230)
    ctx.lineTo(width / 2 + 15, 215)
    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 4
    ctx.stroke()

    // QR Code
    const qrSize = 350
    ctx.drawImage(qrCanvas, (width - qrSize) / 2, 260, qrSize, qrSize)

    // Product name
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 32px -apple-system, sans-serif'
    ctx.fillText(customName, width / 2, 660)

    // Subtitle
    ctx.fillStyle = '#888888'
    ctx.font = '20px -apple-system, sans-serif'
    ctx.fillText(posterFooter, width / 2, 700)

    // Footer
    ctx.font = 'italic 16px -apple-system, sans-serif'
    ctx.fillStyle = '#aaaaaa'
    ctx.fillText('Furnite AR Experience', width / 2, 750)
  }

  const handleDownloadPoster = () => {
    if (posterCanvasRef.current) {
      const url = posterCanvasRef.current.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `ar-poster-${customName.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyEmbed = async () => {
    const embedCode = `<!-- Furnite AR Button -->
<a href="${viewerUrl}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #00f0ff 0%, #0080ff 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 240, 255, 0.3); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 240, 255, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 240, 255, 0.3)';">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
  ${buttonText}
</a>`

    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  const embedCode = `<!-- Furnite AR Button -->
<a href="${viewerUrl}" target="_blank" rel="noopener"
   style="display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; background: linear-gradient(135deg, #00f0ff 0%, #0080ff 100%);
          color: #ffffff; text-decoration: none; border-radius: 8px;
          font-family: -apple-system, sans-serif; font-weight: 600;
          font-size: 16px; box-shadow: 0 4px 12px rgba(0, 240, 255, 0.3);">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
  ${buttonText}
</a>`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0f172a] border-b border-[#1e293b] p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold text-white mb-2">Share AR Experience</h2>
          <p className="text-slate-400 text-sm mb-4">{modelName}</p>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('poster')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'poster'
                  ? 'bg-[#00f0ff] text-[#050a14]'
                  : 'bg-[#1e293b] text-slate-400 hover:text-white'
              }`}
            >
              <Download size={16} />
              QR Poster
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'embed'
                  ? 'bg-[#00f0ff] text-[#050a14]'
                  : 'bg-[#1e293b] text-slate-400 hover:text-white'
              }`}
            >
              <Code size={16} />
              HTML Embed
            </button>
          </div>
        </div>

        {/* Hidden QR canvas - always mounted to prevent regeneration */}
        <canvas ref={qrCanvasRef} style={{ display: 'none' }} />

        <div className="p-6">
          {activeTab === 'poster' ? (
            <div className="space-y-6">
              {/* Customization Options */}
              <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Customize Poster Text</h3>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Display Name <span className="text-slate-600 normal-case">(for poster only)</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                    placeholder="Product name on poster"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={posterTitle}
                    onChange={(e) => setPosterTitle(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={posterSubtitle}
                    onChange={(e) => setPosterSubtitle(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Footer Text</label>
                  <input
                    type="text"
                    value={posterFooter}
                    onChange={(e) => setPosterFooter(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                  />
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">
                  Professional marketing poster with QR code - perfect for printing and displaying on furniture
                </p>

                {/* Poster preview */}
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  <canvas ref={posterCanvasRef} className="max-w-full h-auto" style={{ maxWidth: '300px' }} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-lg p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AR Viewer URL</p>
                  <p className="text-sm text-slate-300 break-all">{viewerUrl}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e293b] hover:bg-[#2d3b55] text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button
                    onClick={handleDownloadPoster}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-[#050a14] rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download size={16} />
                    Download Poster
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customization Options */}
              <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Customize Button</h3>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Display Name <span className="text-slate-600 normal-case">(for button only)</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                    placeholder="Product name in button text"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Button Label</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-[#050a14] border border-[#1e293b] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00f0ff] transition-colors"
                    placeholder="e.g., View in AR, See in 3D, Try in Your Space"
                  />
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-4">
                  Copy this HTML code to embed an AR button on your website
                </p>

                {/* Button Preview */}
                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-8 mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Preview:</p>
                  <div className="flex justify-center">
                    <a
                      href={viewerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00f0ff] to-[#0080ff] text-white rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {buttonText}
                    </a>
                  </div>
                </div>

                {/* HTML Code */}
                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">HTML Code</p>
                    <button
                      onClick={handleCopyEmbed}
                      className="text-xs text-[#00f0ff] hover:text-[#00f0ff]/80 flex items-center gap-1"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                    {embedCode}
                  </pre>
                </div>
              </div>

              <div className="bg-[#1e293b]/50 border border-[#1e293b] rounded-lg p-4">
                <h4 className="text-sm font-bold text-white mb-2">How to use:</h4>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Copy the HTML code above</li>
                  <li>Paste it into your website's HTML</li>
                  <li>The button will link directly to the AR viewer</li>
                  <li>Works on all devices - mobile users get full AR experience</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
