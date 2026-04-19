-- Migration: Add is_unlocked column to generations
-- Business model: generation is free, unlocking (download/share/QR) costs 1 credit.

-- Whether this model has been unlocked by the user (paid with a credit).
-- Unlocked models can be downloaded, shared via AR links, and have QR codes generated.
-- Locked models can still be previewed in the dashboard.
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS is_unlocked boolean DEFAULT false NOT NULL;

-- Index for quick unlock status lookups
CREATE INDEX IF NOT EXISTS idx_generations_is_unlocked
  ON public.generations (is_unlocked)
  WHERE is_unlocked = true;
