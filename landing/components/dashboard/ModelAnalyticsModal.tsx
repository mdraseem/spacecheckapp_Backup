'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, Eye, MousePointer, CheckCircle, AlertCircle } from 'lucide-react'

interface ModelAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  modelUrl: string
  modelName: string
}

interface ModelStats {
  totalViews: number
  arClicks: number
  arActivations: number
  arErrors: number
  conversionRate: string
  devices: {
    ios: number
    android: number
    desktop: number
  }
  recentActivity: Array<{
    event: string
    timestamp: string
    device: string
  }>
}

export function ModelAnalyticsModal({ isOpen, onClose, modelUrl, modelName }: ModelAnalyticsModalProps) {
  const [stats, setStats] = useState<ModelStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && modelUrl) {
      fetchModelAnalytics()
    }
  }, [isOpen, modelUrl])

  const fetchModelAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      // Extract model filename from URL (e.g., "kler/bach.glb")
      const urlParts = modelUrl.split('/')
      const modelFilename = urlParts.slice(-2).join('/') // Get last 2 parts (folder/file.glb)

      // Use user-specific analytics endpoint (no password needed)
      const response = await fetch(`/api/analytics/user?model=${encodeURIComponent(modelFilename)}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Analytics API error:', errorData)
        throw new Error(errorData.error || errorData.message || 'Failed to fetch analytics')
      }

      const data = await response.json()

      if (data.success) {
        // Filter and process data for this specific model
        const modelData = processModelData(data.rawData, modelFilename)
        setStats(modelData)
      } else {
        throw new Error(data.error || 'Failed to process analytics data')
      }
    } catch (err: any) {
      console.error('Analytics error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const processModelData = (rawData: any[], modelFilename: string): ModelStats => {
    const modelEvents = rawData.filter(item => item.model_name === modelFilename)

    const stats: ModelStats = {
      totalViews: 0,
      arClicks: 0,
      arActivations: 0,
      arErrors: 0,
      conversionRate: '0',
      devices: {
        ios: 0,
        android: 0,
        desktop: 0
      },
      recentActivity: []
    }

    modelEvents.forEach(item => {
      const eventType = item.event_type || 'unknown'

      if (eventType === 'view_page') stats.totalViews++
      if (eventType === 'click_ar_view') stats.arClicks++
      if (eventType === 'ar_activated_success') stats.arActivations++
      if (eventType === 'ar_activation_error' || eventType === 'ar_not_available') stats.arErrors++

      // Parse metadata for device info
      let metadata: any = {}
      if (item.metadata) {
        metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
      }

      const userAgent = metadata.userAgent || ''
      const isIOS = metadata.ios || userAgent.includes('iPhone') || userAgent.includes('iPad')
      const isAndroid = userAgent.includes('Android')

      if (isIOS) stats.devices.ios++
      else if (isAndroid) stats.devices.android++
      else stats.devices.desktop++

      // Add to recent activity
      if (stats.recentActivity.length < 10) {
        stats.recentActivity.push({
          event: eventType,
          timestamp: item.created_at,
          device: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'
        })
      }
    })

    // Calculate conversion rate
    stats.conversionRate = stats.arClicks > 0
      ? ((stats.arActivations / stats.arClicks) * 100).toFixed(1)
      : '0'

    return stats
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0f172a] border-b border-[#1e293b] p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-[#00f0ff]" />
            <h2 className="text-2xl font-bold text-white">Analytics</h2>
          </div>
          <p className="text-slate-400 text-sm pr-8">{modelName}</p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff] mx-auto mb-4"></div>
                <p className="text-slate-400">Loading analytics...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-slate-500 text-xs mt-2">
                Analytics may require authentication. Visit the Analytics Dashboard to log in first.
              </p>
            </div>
          )}

          {!loading && !error && stats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-500 uppercase">Total Views</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalViews}</div>
                </div>

                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-500 uppercase">AR Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.arClicks}</div>
                </div>

                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-slate-500 uppercase">AR Activations</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.arActivations}</div>
                </div>

                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs text-slate-500 uppercase">Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-[#00f0ff]">{stats.conversionRate}%</div>
                </div>
              </div>

              {/* Device Distribution */}
              <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Device Distribution</h3>
                <div className="space-y-3">
                  <DeviceBar label="iOS" value={stats.devices.ios} total={stats.devices.ios + stats.devices.android + stats.devices.desktop} color="bg-blue-500" />
                  <DeviceBar label="Android" value={stats.devices.android} total={stats.devices.ios + stats.devices.android + stats.devices.desktop} color="bg-green-500" />
                  <DeviceBar label="Desktop" value={stats.devices.desktop} total={stats.devices.ios + stats.devices.android + stats.devices.desktop} color="bg-slate-500" />
                </div>
              </div>

              {/* Recent Activity */}
              {stats.recentActivity.length > 0 && (
                <div className="bg-[#0a0f1c] border border-[#1e293b] rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Recent Activity</h3>
                  <div className="space-y-2">
                    {stats.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-[#1e293b] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] rounded text-xs font-medium">
                            {activity.event}
                          </span>
                          <span className="text-slate-400 text-xs">{activity.device}</span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.totalViews === 0 && (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400">No analytics data yet</p>
                  <p className="text-slate-500 text-sm mt-1">Share your AR viewer to start collecting data</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeviceBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-[#1e293b] rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
