-- Add soft-delete support to generations table.
-- Deleted generations still count toward monthly usage limits,
-- but are hidden from the dashboard UI.

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.generations.deleted_at
  IS 'Soft-delete timestamp. Non-null means the user removed this from their dashboard, but it still counts toward monthly usage.';

-- Index for efficient filtering of non-deleted generations in dashboard queries
CREATE INDEX IF NOT EXISTS idx_generations_deleted_at
  ON public.generations (deleted_at)
  WHERE deleted_at IS NULL;
