'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import SectionTracker from './SectionTracker';
import { trackLandingEvent } from '@/utils/track';

export default function DemoSection({ dict }: { dict: any }) {
  return (
    <SectionTracker sectionName="demo" event="demo_section_viewed">
      <section id="demo" className="py-24 bg-primary text-white overflow-hidden relative">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">{dict.demo.title}</h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {dict.demo.subtitle}
            </p>
            
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 border border-secondary/50">
                        <span className="font-bold text-secondary">1</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{dict.demo.step1Title}</h4>
                        <p className="text-gray-400">{dict.demo.step1Desc}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 border border-secondary/50">
                        <span className="font-bold text-secondary">2</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{dict.demo.step2Title}</h4>
                        <p className="text-gray-400">{dict.demo.step2Desc}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 border border-secondary/50">
                        <span className="font-bold text-secondary">3</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{dict.demo.step3Title}</h4>
                        <p className="text-gray-400">{dict.demo.step3Desc}</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white text-primary p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{dict.demo.productName}</h3>
                    <p className="text-gray-500 text-sm">{dict.demo.collection}</p>
                </div>
                
                {/* QR Code */}
                <div className="aspect-square bg-white rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden group">
                     <Image 
                        src="/demo-qr.png" 
                        alt="Scan to view Table Bach in AR" 
                        width={250} 
                        height={250} 
                        className="object-contain"
                     />
                     <div className="absolute bottom-2 font-mono text-xs text-gray-400 bg-white/80 px-2 rounded">
                        {dict.demo.scanMe}
                     </div>
                </div>

                <a
                  href={`/viewer.html?model=${encodeURIComponent('kler/bach.glb')}&name=${encodeURIComponent('Stół Bach')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLandingEvent('cta_view_demo_clicked', { source: 'demo_section', demo_type: 'ar_viewer' })}
                  className="w-full bg-secondary text-white py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                >
                    {dict.demo.mobileBtn} <ArrowRight size={18} />
                </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    </SectionTracker>
  );
}