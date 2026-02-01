-- Migration: Add contact_submissions table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_submissions(status);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can read contact submissions" ON public.contact_submissions;

-- Allow anyone to insert (public contact form)
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin panel only)
CREATE POLICY "Service role can read contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (false);

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions from the website';
COMMENT ON COLUMN public.contact_submissions.status IS 'Submission status: new, in_progress, resolved, spam';
