-- Migration: Credit + Active Hosting model
-- Adds credit_balance, hosting fields to profiles, and is_public/archived_at to generations.

-- =====================
-- 1. PROFILES TABLE
-- =====================

-- Credit balance: number of 3D model generations available.
-- New users get 1 free credit (lifetime).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance integer DEFAULT 1 NOT NULL;

-- Hosting status: controls whether the user's AR links are publicly accessible.
-- 'active'  = paying subscriber, links work
-- 'trial'   = free 7-day trial after first generation
-- 'paused'  = subscription canceled/expired/failed, links show placeholder
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hosting_status text DEFAULT 'trial' NOT NULL;

-- When the hosting trial or subscription grace period expires.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hosting_expires_at timestamp with time zone;

-- Stripe subscription ID specifically for the hosting subscription.
-- (Reusing existing stripe_subscription_id for hosting; keeping this for clarity.)
-- No new column needed — stripe_subscription_id already exists.

-- =====================
-- 2. GENERATIONS TABLE
-- =====================

-- Whether this model's AR link is publicly accessible.
-- Controlled by the owner's hosting_status. When hosting is paused,
-- a webhook/cron sets this to false for all the user's models.
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true NOT NULL;

-- When the model was archived due to hosting expiry.
-- NULL = model is active. Set when hosting_status transitions to 'paused'.
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- =====================
-- 3. INDEXES
-- =====================

-- Index for viewer hosting check (looks up generation by glb_url pattern)
CREATE INDEX IF NOT EXISTS idx_generations_is_public ON public.generations (is_public) WHERE is_public = true;

-- Index for quick credit balance lookup
CREATE INDEX IF NOT EXISTS idx_profiles_hosting_status ON public.profiles (hosting_status);

-- =====================
-- 4. HELPER FUNCTION: Archive user models when hosting expires
-- =====================

CREATE OR REPLACE FUNCTION archive_user_models(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.generations
  SET is_public = false,
      archived_at = NOW()
  WHERE user_id = p_user_id
    AND is_public = true
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 5. HELPER FUNCTION: Reactivate user models when hosting resumes
-- =====================

CREATE OR REPLACE FUNCTION reactivate_user_models(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.generations
  SET is_public = true,
      archived_at = NULL
  WHERE user_id = p_user_id
    AND is_public = false
    AND archived_at IS NOT NULL
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
