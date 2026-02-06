'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  eventCounts: Record<string, number>;
  modelViews: Record<string, number>;
  devices: {
    ios: number;
    android: number;
    desktop: number;
  };
  languages: Record<string, number>;
  arStats: {
    clicks: number;
    activations: number;
    errors: number;
    notAvailable: number;
    conversionRate: string;
  };
  recentEvents: Array<{
    event: string;
    model: string;
    timestamp: string;
    device: string;
    userAgent?: string;
    language?: string;
  }>;
  timeline: Record<string, number>;
}

interface AnalyticsResponse {
  success: boolean;
  stats: AnalyticsStats;
  rawData: any[];
}

export default function AnalyticsPage({ lang }: { lang: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/analytics?password=${encodeURIComponent(password)}`);
      const data: AnalyticsResponse = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setStats(data.stats);
        // Store password in sessionStorage for subsequent requests
        sessionStorage.setItem('analytics_password', password);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to fetch analytics. Check console for details.');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    const storedPassword = sessionStorage.getItem('analytics_password');
    if (!storedPassword) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?password=${encodeURIComponent(storedPassword)}`);
      const data: AnalyticsResponse = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-login if password exists in session
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('analytics_password');
    if (storedPassword) {
      setPassword(storedPassword);
      handleLogin({ preventDefault: () => {} } as React.FormEvent);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchAnalytics();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('analytics_password');
    setIsAuthenticated(false);
    setPassword('');
    setStats(null);
  };

  if (!isAuthenticated) {
    return (
      <>
        <header className="bg-gradient-to-r from-[#1a3a52] to-[#208a93] text-white py-6 text-center shadow-lg">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm opacity-80 mt-1">Password required</p>
        </header>

        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-[#1a3a52] mb-2">Analytics Access</h2>
              <p className="text-gray-600 text-sm">Enter password to view dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1a3a52] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter analytics password"
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#208a93] focus:border-transparent"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#208a93] text-white py-3 px-6 rounded-md font-semibold hover:bg-[#208a93]/90 transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href={`/${lang}`} className="text-[#208a93] text-sm hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#208a93] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-gradient-to-r from-[#1a3a52] to-[#208a93] text-white py-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm opacity-80 mt-1">Real-time AR tracking insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 my-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Events"
            value={stats.totalEvents.toLocaleString()}
            icon="📊"
            color="bg-blue-50 border-blue-200"
          />
          <MetricCard
            title="Unique Users"
            value={stats.uniqueUsers.toLocaleString()}
            icon="👥"
            color="bg-green-50 border-green-200"
          />
          <MetricCard
            title="Page Views"
            value={(stats.eventCounts['page_view'] || 0).toLocaleString()}
            icon="👁️"
            color="bg-indigo-50 border-indigo-200"
          />
          <MetricCard
            title="AR Activations"
            value={stats.arStats.activations.toLocaleString()}
            icon="🎯"
            color="bg-purple-50 border-purple-200"
          />
          <MetricCard
            title="AR Success Rate"
            value={`${stats.arStats.conversionRate}%`}
            icon="✨"
            color="bg-yellow-50 border-yellow-200"
          />
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            🔄 Conversion Funnel
          </h2>
          <div className="space-y-3">
            <FunnelBar
              label="Page Views"
              value={stats.eventCounts['page_view'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-blue-500"
            />
            <FunnelBar
              label="Hero CTA Clicks"
              value={(stats.eventCounts['cta_start_free_clicked'] || 0) + (stats.eventCounts['cta_view_demo_clicked'] || 0)}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-indigo-500"
            />
            <FunnelBar
              label="Pricing Viewed"
              value={stats.eventCounts['pricing_section_viewed'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-purple-500"
            />
            <FunnelBar
              label="Signup Initiated"
              value={stats.eventCounts['signup_initiated'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-green-500"
            />
            <FunnelBar
              label="Signup Completed"
              value={stats.eventCounts['signup_completed'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-emerald-600"
            />
            <FunnelBar
              label="Checkout Initiated"
              value={stats.eventCounts['checkout_initiated'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-orange-500"
            />
            <FunnelBar
              label="Subscriptions Activated"
              value={stats.eventCounts['subscription_activated'] || 0}
              max={stats.eventCounts['page_view'] || 1}
              color="bg-green-600"
            />
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Conversion Rates:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Visitor → Signup: {calculatePercentage(stats.eventCounts['signup_completed'] || 0, stats.eventCounts['page_view'] || 1)}%</li>
                <li>• Visitor → Paid: {calculatePercentage(stats.eventCounts['subscription_activated'] || 0, stats.eventCounts['page_view'] || 1)}%</li>
                <li>• Signup → Paid: {calculatePercentage(stats.eventCounts['subscription_activated'] || 0, stats.eventCounts['signup_completed'] || 1)}%</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Landing Page Engagement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            🎯 Landing Page Engagement
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EngagementCard
              title="Features Viewed"
              value={stats.eventCounts['feature_card_viewed'] || 0}
              total={stats.eventCounts['page_view'] || 1}
            />
            <EngagementCard
              title="How It Works"
              value={stats.eventCounts['how_it_works_viewed'] || 0}
              total={stats.eventCounts['page_view'] || 1}
            />
            <EngagementCard
              title="Demo Section"
              value={stats.eventCounts['demo_section_viewed'] || 0}
              total={stats.eventCounts['page_view'] || 1}
            />
            <EngagementCard
              title="FAQ Viewed"
              value={stats.eventCounts['faq_section_viewed'] || 0}
              total={stats.eventCounts['page_view'] || 1}
            />
          </div>
        </div>

        {/* AR Funnel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            🎯 AR Experience Funnel
          </h2>
          <div className="space-y-3">
            <FunnelBar
              label="AR Button Clicks"
              value={stats.arStats.clicks}
              max={stats.arStats.clicks}
              color="bg-blue-500"
            />
            <FunnelBar
              label="AR Activations"
              value={stats.arStats.activations}
              max={stats.arStats.clicks}
              color="bg-green-500"
            />
            <FunnelBar
              label="AR Errors"
              value={stats.arStats.errors}
              max={stats.arStats.clicks}
              color="bg-red-500"
            />
            <FunnelBar
              label="AR Not Available"
              value={stats.arStats.notAvailable}
              max={stats.arStats.clicks}
              color="bg-gray-500"
            />
          </div>
        </div>

        {/* Device & Language Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
              📱 Device Distribution
            </h2>
            <div className="space-y-3">
              <StatBar
                label="iOS"
                value={stats.devices.ios}
                total={stats.devices.ios + stats.devices.android + stats.devices.desktop}
                color="bg-blue-500"
              />
              <StatBar
                label="Android"
                value={stats.devices.android}
                total={stats.devices.ios + stats.devices.android + stats.devices.desktop}
                color="bg-green-500"
              />
              <StatBar
                label="Desktop"
                value={stats.devices.desktop}
                total={stats.devices.ios + stats.devices.android + stats.devices.desktop}
                color="bg-gray-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
              🌍 Language Preferences
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.languages)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => (
                  <StatBar
                    key={lang}
                    label={lang}
                    value={count}
                    total={Object.values(stats.languages).reduce((a, b) => a + b, 0)}
                    color="bg-purple-500"
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            🪑 Most Viewed Models
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.modelViews)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([model, count]) => (
                <StatBar
                  key={model}
                  label={model || 'Unknown'}
                  value={count}
                  total={Math.max(...Object.values(stats.modelViews))}
                  color="bg-[#208a93]"
                />
              ))}
          </div>
        </div>

        {/* Event Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            📈 Event Types
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.eventCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([event, count]) => (
                <div key={event} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-[#1a3a52]">{count}</div>
                  <div className="text-sm text-gray-600 mt-1">{event.replace(/_/g, ' ')}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#1a3a52] mb-4 flex items-center gap-2">
            🕐 Recent Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-[#1a3a52]">Time</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#1a3a52]">Event</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#1a3a52]">Model</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#1a3a52]">Device</th>
                  <th className="text-left py-2 px-3 font-semibold text-[#1a3a52]">Language</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.slice(0, 20).map((event, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {event.event}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">{event.model || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        event.device === 'iOS' ? 'bg-blue-100 text-blue-800' :
                        event.device === 'Android' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.device}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">{event.language || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 text-gray-600 py-6 text-center mt-8">
        <Link href={`/${lang}`} className="text-[#208a93] hover:underline">
          ← Back to Home
        </Link>
      </footer>
    </>
  );
}

// Helper Components
function MetricCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <div className={`${color} border rounded-lg p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-[#1a3a52] mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-[#1a3a52]">{value.toLocaleString()} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-[#1a3a52]">{value.toLocaleString()} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function EngagementCard({ title, value, total }: { title: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="text-2xl font-bold text-[#1a3a52]">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of visitors</div>
    </div>
  );
}

function calculatePercentage(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.0';
  return ((numerator / denominator) * 100).toFixed(1);
}
