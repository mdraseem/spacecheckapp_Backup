import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

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

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          stripe_customer_id: customerId,
        });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        address: 'auto', // Save billing address to Customer for automatic tax
        name: 'auto',    // Save name to Customer for tax ID collection
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
        trial_period_days: 14, // 14-day free trial
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required', // Collect billing address for invoices
      tax_id_collection: {
        enabled: true, // Allow customers to provide VAT/Tax ID
      },
      automatic_tax: {
        enabled: true, // Enable Stripe Tax (requires setup in dashboard)
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
