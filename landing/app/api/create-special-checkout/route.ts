import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Special checkout endpoint for VIP customers with extended trials
 * Use query param: ?trial_days=60 for 2 months free
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, trialDays = 14 } = body;

    if (!priceId || !Object.values(PRICE_IDS).includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Free plan - no checkout needed
    if (priceId === PRICE_IDS.starter) {
      return NextResponse.json({
        message: 'You are already on the free plan'
      });
    }

    // Create or retrieve Stripe customer
    let customerId: string;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
        });
    }

    // Create Checkout Session with custom trial period
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        address: 'auto', // Save billing address to Customer for automatic tax
      },
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays, // Custom trial period
        metadata: {
          user_id: user.id,
          special_offer: trialDays > 14 ? 'vip_extended_trial' : 'standard',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
