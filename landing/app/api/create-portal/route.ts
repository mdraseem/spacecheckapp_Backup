import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import {
  isShopifyMerchant,
  STRIPE_BLOCKED_FOR_SHOPIFY_ERROR,
} from '@/utils/billing-source';

/**
 * Stripe billing portal — only available for direct (non-Shopify) users.
 * Shopify merchants manage their subscription through the Shopify admin.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Shopify-installed merchants manage billing through Shopify Admin, not Stripe.
    if (await isShopifyMerchant(supabase, user.id)) {
      return NextResponse.json(STRIPE_BLOCKED_FOR_SHOPIFY_ERROR, { status: 403 });
    }

    // Get Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
