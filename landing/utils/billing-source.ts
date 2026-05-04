import { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Billing source detection
//
// SpaceCheck supports two billing pathways to comply with Shopify App Store
// requirements (Shopify rule 1.2.1 — apps must use Managed Pricing or the
// Shopify Billing API for any charges; off-platform billing is not allowed
// for Shopify-installed merchants).
//
// Rules:
//   1. If a user has a row in `shopify_stores`, they MUST be billed via
//      Shopify Managed Pricing. All Stripe paths are blocked for them.
//   2. If a user has no `shopify_stores` row, they signed up directly via
//      spacecheck.app and are billed through Stripe as before.
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has at least one connected Shopify store.
 * Such users MUST be billed via Shopify Managed Pricing (not Stripe).
 */
export async function isShopifyMerchant(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('shopify_stores')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    // On error, fail safe: treat as Shopify merchant only if we know for sure.
    // (Returning false here lets Stripe paths continue working for direct users
    // even if shopify_stores is unavailable — the same code path that exists today.)
    return false
  }

  return !!data
}

/**
 * Returns the shop_domain for a user's Shopify connection, or null if not connected.
 */
export async function getShopDomain(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  return data?.shop_domain ?? null
}

/**
 * Convert a *.myshopify.com domain into the store handle used in Shopify Admin URLs.
 * e.g. "acme-store.myshopify.com" -> "acme-store"
 */
export function shopDomainToHandle(shopDomain: string): string {
  return shopDomain.replace(/\.myshopify\.com$/i, '')
}

/**
 * Build the Shopify Managed Pricing URL for a given shop.
 *
 * Shopify hosts the pricing/plan-selection page itself when Managed Pricing is
 * configured in the Partner Dashboard. We send merchants there instead of
 * presenting our own checkout.
 *
 * Format: https://admin.shopify.com/store/{store-handle}/charges/{app-handle}/pricing_plans
 *
 * The {app-handle} is configured in env var SHOPIFY_APP_HANDLE (the URL slug
 * used by Shopify for your app — visible in your Partner Dashboard).
 */
export function getManagedPricingUrl(shopDomain: string): string {
  const appHandle = process.env.SHOPIFY_APP_HANDLE || 'spacecheck'
  const storeHandle = shopDomainToHandle(shopDomain)
  return `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`
}

/**
 * Standard JSON error returned to Shopify-installed merchants who attempt to
 * hit a Stripe billing endpoint. Front-end should detect this code and
 * redirect them to the Managed Pricing URL instead.
 */
export const STRIPE_BLOCKED_FOR_SHOPIFY_ERROR = {
  error:
    'Stripe billing is not available for Shopify-installed merchants. Use Shopify Managed Pricing.',
  code: 'shopify_managed_pricing_required',
} as const
