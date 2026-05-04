import { NextRequest, NextResponse } from 'next/server';
import { stripe, CREDIT_PRICE_IDS } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import {
  isShopifyMerchant,
  STRIPE_BLOCKED_FOR_SHOPIFY_ERROR,
} from '@/utils/billing-source';

/**
 * Creates a Stripe Checkout session for one-time credit pack purchases.
 * Expects: { priceId: string } (one of the CREDIT_PRICE_IDS values)
 *
 * NOTE: Per Shopify App Store rule 1.2.1, Shopify-installed merchants are
 * blocked from using Stripe. They get an unlimited usage allowance bundled
 * into their Shopify-billed plan instead of buying one-time credits.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Shopify-installed merchants must use Shopify Managed Pricing.
    if (await isShopifyMerchant(supabase, user.id)) {
      return NextResponse.json(STRIPE_BLOCKED_FOR_SHOPIFY_ERROR, { status: 403 });
    }

    const body = await req.json();
    const { priceId } = body;

    // Validate price ID is a valid credit pack
    const validCreditPriceIds = Object.values(CREDIT_PRICE_IDS).filter(Boolean);
    if (!priceId || !validCreditPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let customerId: string;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

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

    // Create one-time payment Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      mode: 'payment', // One-time payment, NOT subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?credits_purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        purchase_type: 'credits',
        price_id: priceId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Credit checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
