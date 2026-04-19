import { Check, Zap, Unlock, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function Pricing({ dict }: { dict: any }) {
  const p = dict.pricing

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-4">{p.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {/* TIER 1: Generate (Credits) */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary">{p.payAsYouGo.name}</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">{p.payAsYouGo.desc}</p>

            {/* Credit Packs Display */}
            <div className="space-y-3 mb-6">
              {p.payAsYouGo.packs.map((pack: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    i === 1 ? 'border-secondary bg-secondary/5' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <span className="text-base font-bold text-primary">
                      {pack.credits} {pack.credits === 1 ? 'Credit' : 'Credits'}
                    </span>
                    {i === 1 && (
                      <span className="ml-2 text-xs font-bold bg-secondary text-white px-2 py-0.5 rounded-full">
                        {p.mostPopular}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">{pack.perUnit}</p>
                  </div>
                  <span className="text-xl font-bold text-primary">{pack.price}</span>
                </div>
              ))}
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {p.payAsYouGo.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full text-center bg-gray-100 text-primary font-bold py-3 rounded-xl hover:bg-gray-200 transition-all block"
            >
              {p.payAsYouGo.cta}
            </Link>
          </div>

          {/* TIER 2: Unlock Per Model — Highlighted */}
          <div className="relative bg-white rounded-2xl p-8 border-2 border-secondary shadow-xl md:scale-105 z-10 flex flex-col">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
              {p.unlockLabel || 'Try Before You Buy'}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Unlock className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary">{p.unlock.name}</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">{p.unlock.desc}</p>

            <div className="mb-6">
              <span className="text-5xl font-bold text-primary">{p.unlock.price}</span>
              {p.unlock.price !== 'Free' && p.unlock.price !== 'Za Darmo' && (
                <span className="text-gray-500">{p.perModel}</span>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {p.unlock.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="w-full text-center bg-secondary text-white font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 block"
            >
              {p.unlock.cta}
            </Link>
          </div>

          {/* TIER 3: Enterprise */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary">{p.enterprise.name}</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">{p.enterprise.desc}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-primary">{p.enterprise.price}</span>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {p.enterprise.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                  <Check size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className="w-full text-center bg-gray-100 text-primary font-bold py-3 rounded-xl hover:bg-gray-200 transition-all block"
            >
              {p.enterprise.cta}
            </Link>
          </div>
        </div>

        {p.currencyNote && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">{p.currencyNote}</p>
          </div>
        )}
      </div>
    </section>
  )
}
