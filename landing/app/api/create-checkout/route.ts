import { NextRequest, NextResponse } from 'next/server';
import { stripe, HOSTING_PRICE_ID, PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Creates a Stripe Checkout session for the monthly hosting subscription ($29/mo).
 * This is the "Engine" part of the Fuel & Engine model.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    // Accept both the new hosting price ID and legacy growth price ID
    const validPriceIds = [HOSTING_PRICE_ID, PRICE_IDS.growth].filter(Boolean);

    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Check if user already has an active hosting subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, hosting_status, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profile?.hosting_status === 'active' && profile?.stripe_subscription_id) {
      return NextResponse.json({
        message: 'You already have an active hosting subscription. Manage it from Settings.',
      });
    }

    // Create or retrieve Stripe customer
    let customerId: string;

    if (profile?.stripe_customer_id) {
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(profile.stripe_customer_id);
        customerId = profile.stripe_customer_id;
      } catch {
        // Customer was deleted or doesn't exist — create a new one
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }
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

    // Create Checkout Session for hosting subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        address: 'auto',
        name: 'auto',
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
        metadata: {
          user_id: user.id,
          subscription_type: 'hosting',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?hosting_activated=true`,
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
        purchase_type: 'hosting',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Hosting checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
