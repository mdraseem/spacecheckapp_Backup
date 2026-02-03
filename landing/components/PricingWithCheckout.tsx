'use client'

import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function PricingWithCheckout({ dict }: { dict: any }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const plans = [
    {
      name: dict.pricing.starter.name,
      price: "$0",
      period: dict.pricing.period,
      description: dict.pricing.starter.desc,
      features: dict.pricing.starter.features,
      cta: dict.pricing.starter.cta,
      highlighted: false,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
      planType: 'starter'
    },
    {
      name: dict.pricing.growth.name,
      price: "$49",
      period: dict.pricing.period,
      description: dict.pricing.growth.desc,
      features: dict.pricing.growth.features,
      cta: dict.pricing.growth.cta,
      highlighted: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH || '',
      planType: 'growth'
    },
    {
      name: dict.pricing.enterprise.name,
      price: dict.pricing.enterprise.price,
      period: "",
      description: dict.pricing.enterprise.desc,
      features: dict.pricing.enterprise.features,
      cta: dict.pricing.enterprise.cta,
      highlighted: false,
      priceId: '',
      planType: 'enterprise'
    }
  ];

  const handlePlanSelect = async (plan: typeof plans[0]) => {
    setLoadingPlan(plan.planType);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login
        router.push('/login');
        return;
      }

      // Free plan - just redirect to dashboard
      if (plan.planType === 'starter') {
        router.push('/dashboard');
        return;
      }

      // Enterprise - redirect to contact
      if (plan.planType === 'enterprise') {
        router.push('/contact');
        return;
      }

      // Paid plan - create checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

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
              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={loadingPlan === plan.planType}
                className={`w-full py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${plan.highlighted ? 'bg-secondary text-white hover:bg-secondary/90' : 'bg-gray-100 text-primary hover:bg-gray-200'}`}
              >
                {loadingPlan === plan.planType ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  plan.cta
                )}
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
