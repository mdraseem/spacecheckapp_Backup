import { NextRequest, NextResponse } from 'next/server';
import { stripe, CREDIT_AMOUNTS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Disable body parsing - Stripe needs raw body
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    switch (event.type) {
      // ==================================================
      // CHECKOUT COMPLETED — handle both credits and hosting
      // ==================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseType = session.metadata?.purchase_type;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error('Webhook: No user_id in session metadata');
          break;
        }

        if (purchaseType === 'credits') {
          // ----- ONE-TIME CREDIT PURCHASE -----
          const priceId = session.metadata?.price_id;
          const creditAmount = priceId ? (CREDIT_AMOUNTS[priceId] || 0) : 0;

          if (creditAmount > 0) {
            // Add credits to user's balance
            const { data: profile } = await supabase
              .from('profiles')
              .select('credit_balance')
              .eq('id', userId)
              .single();

            const currentBalance = profile?.credit_balance || 0;

            await supabase
              .from('profiles')
              .upsert({
                id: userId,
                stripe_customer_id: session.customer as string,
                credit_balance: currentBalance + creditAmount,
                updated_at: new Date().toISOString(),
              });

            // Track analytics
            await supabase
              .from('analytics')
              .insert({
                event_type: 'credits_purchased',
                user_id: userId,
                metadata: {
                  credits_added: creditAmount,
                  new_balance: currentBalance + creditAmount,
                  price_id: priceId,
                  session_id: session.id,
                  amount_total: session.amount_total,
                },
              });

            console.log(`Credits purchased: +${creditAmount} for user ${userId} (new balance: ${currentBalance + creditAmount})`);
          }

        } else if (purchaseType === 'hosting' || session.subscription) {
          // ----- HOSTING SUBSCRIPTION -----
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await supabase
            .from('profiles')
            .upsert({
              id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: subscription.status,
              hosting_status: 'active',
              plan_type: 'pro',
              updated_at: new Date().toISOString(),
            });

          // Reactivate all archived models for this user
          await supabase
            .from('generations')
            .update({ is_public: true, archived_at: null })
            .eq('user_id', userId)
            .eq('is_public', false)
            .not('archived_at', 'is', null);

          // Track analytics
          await supabase
            .from('analytics')
            .insert({
              event_type: 'hosting_activated',
              user_id: userId,
              metadata: {
                subscription_id: session.subscription,
                customer_id: session.customer,
                status: subscription.status,
              },
            });

          console.log('Hosting subscription created:', session.id, 'Status:', subscription.status);
        }
        break;
      }

      // ==================================================
      // SUBSCRIPTION UPDATED (status changes)
      // ==================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const updateData: Record<string, any> = {
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        };

        // If subscription becomes active, ensure hosting is active
        if (subscription.status === 'active') {
          updateData.hosting_status = 'active';
        }

        await supabase
          .from('profiles')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id);

        // If reactivated, also reactivate models
        if (subscription.status === 'active') {
          // Find user_id from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (profile) {
            await supabase
              .from('generations')
              .update({ is_public: true, archived_at: null })
              .eq('user_id', profile.id)
              .eq('is_public', false)
              .not('archived_at', 'is', null);
          }
        }

        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        break;
      }

      // ==================================================
      // SUBSCRIPTION DELETED — THE KILL SWITCH
      // ==================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find the user
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        // Pause hosting + archive all models
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            hosting_status: 'paused',
            plan_type: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Archive all models (the kill switch)
        if (profile) {
          await supabase
            .from('generations')
            .update({
              is_public: false,
              archived_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
            .eq('is_public', true)
            .is('deleted_at', null);

          console.log(`Kill switch: Archived all models for user ${profile.id}`);
        }

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      // ==================================================
      // PAYMENT SUCCESS
      // ==================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);
        console.log('Invoice PDF:', invoice.invoice_pdf);
        console.log('Invoice URL:', invoice.hosted_invoice_url);
        break;
      }

      // ==================================================
      // PAYMENT FAILED — PAUSE HOSTING
      // ==================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        // Find the user and pause their hosting
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single();

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            hosting_status: 'paused',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', invoice.customer as string);

        // Archive all models
        if (profile) {
          await supabase
            .from('generations')
            .update({
              is_public: false,
              archived_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
            .eq('is_public', true)
            .is('deleted_at', null);

          console.log(`Payment failed: Archived all models for user ${profile.id}`);
        }

        console.log('Payment failed:', invoice.id);
        break;
      }

      // ==================================================
      // INVOICE FINALIZED
      // ==================================================
      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice finalized:', invoice.id);
        console.log('Invoice number:', invoice.number);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
