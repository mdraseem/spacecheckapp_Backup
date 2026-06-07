'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Smartphone, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { trackLandingEvent, trackCTAClick } from '@/utils/track';

const ModelViewer = dynamic(() => import('./ModelViewer'), { ssr: false });

export default function Hero({ dict, lang }: { dict: any, lang: string }) {
  // Track hero section view
  useEffect(() => {
    trackLandingEvent('hero_view', { page: 'home', lang });
  }, [lang]);
  return (
    <section className="pt-32 pb-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/50 text-secondary px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-accent">
            <Zap size={16} />
            <span>{dict.hero.newBadge}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-primary">
            {dict.hero.titleStart} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{dict.hero.titleEnd}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {dict.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
            <Link
              href="/login"
              onClick={() => trackCTAClick(dict.hero.ctaStart, '/login', { position: 'hero_primary' })}
              className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
            >
              {dict.hero.ctaStart}
            </Link>
            <Link
              href="#demo"
              onClick={() => trackLandingEvent('cta_view_demo_clicked', { position: 'hero_secondary' })}
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all"
            >
              {dict.hero.ctaDemo} <ArrowRight size={20} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">{dict.hero.disclaimer}</p>

          {/* Shopify App Store Badge */}
          <div className="mt-8 flex justify-center">
            <a
              href="https://apps.shopify.com/spacecheck"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackLandingEvent('shopify_app_store_clicked', { position: 'hero' })}
              className="group inline-flex items-center gap-3 bg-white border border-gray-200 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
            >
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15.337 3.18c-.09-.007-.197.02-.27.045-.01.003-.21.064-.54.166-.32-.92-.886-1.766-1.88-1.766h-.087c-.283-.367-.633-.527-.936-.527-2.31 0-3.414 2.89-3.76 4.358-.898.278-1.536.476-1.617.502-.502.157-.518.173-.583.646-.05.357-1.363 10.51-1.363 10.51L13.07 22l5.553-1.2S15.428 3.45 15.337 3.18zm-3.21 1.04c-.518.16-1.083.336-1.692.524.342-1.32.983-1.957 1.543-2.198.143.366.21.886.21 1.674h-.06zm-1.05-2.01c.1 0 .2.034.295.1-.736.346-1.526 1.22-1.86 2.965-.487.15-.963.298-1.404.435.392-1.335 1.31-3.5 2.97-3.5zm.47 9.43s-.59-.314-1.31-.314c-1.057 0-1.11.663-1.11.83 0 .91 2.374 1.26 2.374 3.394 0 1.68-1.064 2.76-2.5 2.76-1.722 0-2.6-1.072-2.6-1.072l.46-1.524s.903.776 1.665.776c.498 0 .7-.392.7-.678 0-1.187-1.947-1.24-1.947-3.193 0-1.643 1.18-3.234 3.56-3.234 1.92 0 2.025 1.07 2.025 1.07l-.69 1.5z" fill="#95BF47"/>
                <path d="M15.337 3.18c-.09-.007-.197.02-.27.045-.01.003-.21.064-.54.166-.32-.92-.886-1.766-1.88-1.766h-.087c-.283-.367-.633-.527-.936-.527L13.07 22l5.553-1.2S15.428 3.45 15.337 3.18z" fill="#5E8E3E"/>
                <path d="M13.082 7.503l-.69 1.5s-.59-.314-1.31-.314c-1.057 0-1.11.663-1.11.83 0 .91 2.374 1.26 2.374 3.394 0 1.68-1.064 2.76-2.5 2.76-1.722 0-2.6-1.072-2.6-1.072l.46-1.524s.903.776 1.665.776c.498 0 .7-.392.7-.678 0-1.187-1.947-1.24-1.947-3.193 0-1.643 1.18-3.234 3.56-3.234 1.92 0 2.025 1.07 2.025 1.07z" fill="#fff"/>
              </svg>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{dict.hero.shopifyBadge}</span>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative mx-auto max-w-7xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-primary rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Left: Standard Photo */}
                    <div className="w-full lg:w-5/12 bg-gray-50 flex flex-col items-center justify-center relative min-h-[400px] lg:min-h-[600px]">
                         <Image
                            src="/hero-photo.jpg"
                            alt="Standard Furniture Photo"
                            fill
                            className="object-cover"
                         />
                         <div className="absolute top-4 left-4 font-semibold text-white bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm text-sm">
                            📸 {dict.hero.photoLabel}
                         </div>
                    </div>

                    {/* Center: Transformation Arrow */}
                    <div className="relative lg:w-2/12 flex items-center justify-center bg-gradient-to-b from-gray-100 via-gray-200 to-gray-800 py-8 lg:py-0">
                        {/* Background glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-secondary/10 to-transparent"></div>

                        {/* Animated Arrow */}
                        <div className="relative z-10 flex flex-row lg:flex-col items-center justify-center gap-3 animate-pulse">
                            {/* Desktop: Vertical Arrow */}
                            <div className="hidden lg:flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-secondary">
                                    <Zap className="text-secondary" size={28} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-1 h-12 bg-gradient-to-b from-secondary to-secondary/50"></div>
                                    <div className="my-2">
                                        <ArrowRight className="text-secondary drop-shadow-lg rotate-90" size={40} strokeWidth={3} />
                                    </div>
                                    <div className="w-1 h-12 bg-gradient-to-b from-secondary/50 to-secondary"></div>
                                </div>
                                <div className="text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-full shadow-md border-2 border-secondary/30">
                                    AI
                                </div>
                            </div>

                            {/* Mobile: Horizontal Arrow */}
                            <div className="flex lg:hidden flex-row items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-secondary">
                                    <Zap className="text-secondary" size={22} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-10 bg-gradient-to-r from-secondary to-secondary/50"></div>
                                    <ArrowRight className="text-secondary drop-shadow-lg" size={32} strokeWidth={3} />
                                    <div className="h-1 w-10 bg-gradient-to-r from-secondary/50 to-secondary"></div>
                                </div>
                                <div className="text-sm font-bold text-gray-900 bg-white px-3 py-1.5 rounded-full shadow-md border-2 border-secondary/30">
                                    AI
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: 3D Model Viewer - ENLARGED */}
                    <div className="w-full lg:w-5/12 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative min-h-[400px] lg:min-h-[600px] p-4">
                        {/* Subtle background effects */}
                        <div className="absolute inset-0 opacity-10">
                             <div className="absolute top-10 left-10 w-20 h-20 border border-white/30 rounded-full"></div>
                             <div className="absolute bottom-20 right-20 w-32 h-32 border border-white/30 rounded-full"></div>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
                        </div>

                        {/* 3D Model Viewer - Much Larger */}
                        <div className="relative z-10 w-full h-full bg-gray-800/50 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden">
                             <ModelViewer />

                             {/* Minimal corner badge instead of bottom label */}
                             <div className="absolute top-4 right-4">
                                <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center backdrop-blur-md">
                                    <span className="text-secondary text-lg">3D</span>
                                </div>
                             </div>

                             {/* Interactive hint - subtle */}
                             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-xs flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Rotate • Zoom • Explore
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}