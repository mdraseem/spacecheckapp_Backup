-- Migration: Add profiles table for subscription management
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive',
  plan_type text DEFAULT 'starter',
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(stripe_subscription_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can insert/update for webhook handling
CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.profiles IS 'User subscription and billing information';
COMMENT ON COLUMN public.profiles.subscription_status IS 'active, canceled, past_due, trialing, incomplete, inactive';
COMMENT ON COLUMN public.profiles.plan_type IS 'starter, growth, enterprise';
