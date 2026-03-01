import { Printer, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Omnichannel({ dict, lang }: { dict: any; lang: string }) {
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text Content */}
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <ShoppingBag size={16} />
              <span>In-Store Experience</span>
            </div>
            <h2 className="text-4xl font-bold text-primary mb-6 leading-tight">
              {dict.omnichannel.title}
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {dict.omnichannel.subtitle}
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 text-primary">
                  <Printer size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary mb-2">{dict.omnichannel.feature1Title}</h3>
                  <p className="text-gray-600">{dict.omnichannel.feature1Desc}</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 text-primary">
                  <ArrowRight size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary mb-2">{dict.omnichannel.feature2Title}</h3>
                  <p className="text-gray-600">{dict.omnichannel.feature2Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="order-1 md:order-2 relative">
             {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-gray-100 to-gray-50 rounded-full blur-3xl -z-10"></div>
            
            <div className="relative">
                {/* The Poster Image */}
                <div className="relative bg-white p-2 shadow-2xl rounded-lg transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 border border-gray-200 w-3/4 mx-auto z-10">
                    <Image
                        src={`/poster-example-${lang}.png`}
                        alt="AR QR Poster"
                        width={400}
                        height={500}
                        className="w-full h-auto rounded"
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 font-mono bg-white/90 px-2 py-1 rounded">
                        {lang === 'en' ? 'Printable Poster' : 'Plakat do wydruku'}
                    </div>
                </div>

                {/* Optional Context Photo (Overlaid) - Only shows if we had one, for now simulated with a caption or secondary card */}
                {/* 
                <div className="absolute -bottom-10 -right-4 w-48 h-48 bg-gray-200 rounded-lg shadow-xl border-4 border-white overflow-hidden">
                     <Image src="/in-store-context.jpg" fill className="object-cover" />
                </div> 
                */}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-8 italic">
              {dict.omnichannel.imageCaption}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
