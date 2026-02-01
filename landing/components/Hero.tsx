'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Smartphone, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

const ModelViewer = dynamic(() => import('./ModelViewer'), { ssr: false });

export default function Hero({ dict, lang }: { dict: any, lang: string }) {
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
              className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
            >
              {dict.hero.ctaStart}
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all"
            >
              {dict.hero.ctaDemo} <ArrowRight size={20} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">{dict.hero.disclaimer}</p>
        </div>

        {/* Hero Visual */}
        <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-primary rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden aspect-[16/9] flex">
                {/* Left: Standard Photo */}
                <div className="w-1/2 bg-gray-50 flex flex-col items-center justify-center border-r border-gray-100 relative">
                     <Image 
                        src="/hero-photo.jpg" 
                        alt="Standard Furniture Photo" 
                        fill
                        className="object-cover"
                     />
                     <div className="absolute bottom-4 left-4 font-semibold text-white bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                        {dict.hero.photoLabel}
                     </div>
                </div>

                {/* Right: AR View */}
                <div className="w-1/2 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                         <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
                         <div className="absolute bottom-20 right-20 w-32 h-32 border border-white/20 rounded-full"></div>
                    </div>
                    <div className="relative z-10 w-full max-w-xs aspect-[9/16] bg-black rounded-[2rem] border-4 border-gray-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                        {/* 3D Model Viewer */}
                        <div className="w-full h-full bg-gray-800 relative">
                             <ModelViewer />
                             
                             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                                {dict.hero.arLabel}
                             </div>
                        </div>
                    </div>
                    <div className="absolute bottom-8 right-8 text-white/80 flex items-center gap-2">
                        <Smartphone size={20} />
                        <span className="text-sm font-medium">{dict.hero.livePreview}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}