-- Add billing_source to profiles to support dual billing (Stripe + Shopify)
-- billing_source: 'stripe' (default, direct signups) or 'shopify' (Shopify App Store installs)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_source text DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS shopify_subscription_id text,
  ADD COLUMN IF NOT EXISTS shopify_subscription_status text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.billing_source IS 'Payment source: stripe or shopify';
COMMENT ON COLUMN public.profiles.shopify_subscription_id IS 'Shopify app subscription GID (e.g. gid://shopify/AppSubscription/12345)';
COMMENT ON COLUMN public.profiles.shopify_subscription_status IS 'Shopify subscription status: active, pending, declined, expired, frozen, cancelled';
