import { shopifyGraphQL, decryptToken } from './shopify'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Shopify Billing API — Dual billing support
// ---------------------------------------------------------------------------

const SHOPIFY_GROWTH_PLAN_PRICE = 49.0
const SHOPIFY_GROWTH_PLAN_NAME = 'SpaceCheck Growth'
const SHOPIFY_TRIAL_DAYS = 14

// ---------------------------------------------------------------------------
// GraphQL Mutations & Queries
// ---------------------------------------------------------------------------

const APP_SUBSCRIPTION_CREATE = `
  mutation AppSubscriptionCreate(
    $name: String!,
    $lineItems: [AppSubscriptionLineItemInput!]!,
    $returnUrl: URL!,
    $trialDays: Int
  ) {
    appSubscriptionCreate(
      name: $name,
      returnUrl: $returnUrl,
      trialDays: $trialDays,
      lineItems: $lineItems,
      test: ${process.env.NODE_ENV !== 'production' ? 'true' : 'false'}
    ) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
      confirmationUrl
    }
  }
`

const APP_SUBSCRIPTION_STATUS = `
  query {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        trialDays
        currentPeriodEnd
        lineItems {
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
                interval
              }
            }
          }
        }
      }
    }
  }
`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopifySubscription {
  id: string
  name: string
  status: string
  trialDays: number
  currentPeriodEnd: string | null
  lineItems: {
    plan: {
      pricingDetails: {
        price: { amount: string; currencyCode: string }
        interval: string
      }
    }
  }[]
}

export interface CreateSubscriptionResult {
  confirmationUrl: string
  subscriptionId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Get the shop domain and decrypted access token for a user.
 */
export async function getShopCredentials(
  userId: string
): Promise<{ shop: string; accessToken: string } | null> {
  const supabase = getServiceSupabase()

  const { data: store } = await supabase
    .from('shopify_stores')
    .select('shop_domain, access_token_encrypted')
    .eq('user_id', userId)
    .single()

  if (!store) return null

  return {
    shop: store.shop_domain,
    accessToken: decryptToken(store.access_token_encrypted),
  }
}

// ---------------------------------------------------------------------------
// Create a Shopify app subscription (Growth plan)
// ---------------------------------------------------------------------------

export async function createShopifySubscription(
  userId: string,
  returnUrl: string
): Promise<CreateSubscriptionResult> {
  const creds = await getShopCredentials(userId)
  if (!creds) {
    throw new Error('No Shopify store connected for this user')
  }

  const result = await shopifyGraphQL<{
    appSubscriptionCreate: {
      userErrors: { field: string; message: string }[]
      appSubscription: { id: string; status: string } | null
      confirmationUrl: string | null
    }
  }>(creds.shop, creds.accessToken, APP_SUBSCRIPTION_CREATE, {
    name: SHOPIFY_GROWTH_PLAN_NAME,
    returnUrl,
    trialDays: SHOPIFY_TRIAL_DAYS,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: SHOPIFY_GROWTH_PLAN_PRICE,
              currencyCode: 'USD',
            },
            interval: 'EVERY_30_DAYS',
          },
        },
      },
    ],
  })

  const data = result.data.appSubscriptionCreate

  if (data.userErrors?.length) {
    throw new Error(
      `Shopify billing error: ${data.userErrors.map((e) => e.message).join(', ')}`
    )
  }

  if (!data.confirmationUrl || !data.appSubscription) {
    throw new Error('No confirmation URL returned from Shopify')
  }

  return {
    confirmationUrl: data.confirmationUrl,
    subscriptionId: data.appSubscription.id,
  }
}

// ---------------------------------------------------------------------------
// Get active Shopify subscription for a shop
// ---------------------------------------------------------------------------

export async function getActiveShopifySubscription(
  userId: string
): Promise<ShopifySubscription | null> {
  const creds = await getShopCredentials(userId)
  if (!creds) return null

  const result = await shopifyGraphQL<{
    currentAppInstallation: {
      activeSubscriptions: ShopifySubscription[]
    }
  }>(creds.shop, creds.accessToken, APP_SUBSCRIPTION_STATUS)

  const subs = result.data.currentAppInstallation?.activeSubscriptions
  if (!subs || subs.length === 0) return null

  // Return the first active subscription (should only be one)
  return subs[0]
}

// ---------------------------------------------------------------------------
// Sync Shopify subscription status to profiles table
// ---------------------------------------------------------------------------

export async function syncShopifySubscriptionToProfile(
  userId: string,
  subscription: {
    id: string
    status: string
  }
): Promise<void> {
  const supabase = getServiceSupabase()

  // Map Shopify status to our plan type
  const isActive =
    subscription.status === 'ACTIVE' ||
    subscription.status === 'active'

  const planType = isActive ? 'growth' : 'starter'
  const subStatus = subscription.status.toLowerCase()

  await supabase.from('profiles').upsert({
    id: userId,
    billing_source: 'shopify',
    shopify_subscription_id: subscription.id,
    shopify_subscription_status: subStatus,
    plan_type: planType,
    subscription_status: subStatus === 'active' ? 'active' : subStatus,
    updated_at: new Date().toISOString(),
  })
}

// ---------------------------------------------------------------------------
// Check if a user is billed through Shopify
// ---------------------------------------------------------------------------

export async function isShopifyBilledUser(userId: string): Promise<boolean> {
  const supabase = getServiceSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('billing_source')
    .eq('id', userId)
    .single()

  return profile?.billing_source === 'shopify'
}
