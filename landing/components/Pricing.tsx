import { Check } from 'lucide-react';

export default function Pricing({ dict }: { dict: any }) {
  const plans = [
    {
      name: dict.pricing.starter.name,
      price: "$0",
      period: dict.pricing.period,
      description: dict.pricing.starter.desc,
      features: dict.pricing.starter.features,
      cta: dict.pricing.starter.cta,
      highlighted: false
    },
    {
      name: dict.pricing.growth.name,
      price: "$49",
      period: dict.pricing.period,
      description: dict.pricing.growth.desc,
      features: dict.pricing.growth.features,
      cta: dict.pricing.growth.cta,
      highlighted: true
    },
    {
      name: dict.pricing.enterprise.name,
      price: dict.pricing.enterprise.price,
      period: "",
      description: dict.pricing.enterprise.desc,
      features: dict.pricing.enterprise.features,
      cta: dict.pricing.enterprise.cta,
      highlighted: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-4">{dict.pricing.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {dict.pricing.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`relative rounded-2xl p-8 border ${plan.highlighted ? 'border-secondary shadow-xl scale-105 z-10' : 'border-gray-200 shadow-sm'} bg-white flex flex-col`}>
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                  {dict.pricing.mostPopular}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-primary">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-bold transition-colors ${plan.highlighted ? 'bg-secondary text-white hover:bg-secondary/90' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Currency Note */}
        {dict.pricing.currencyNote && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              {dict.pricing.currencyNote}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}