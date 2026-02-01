-- Migration: Add dimensions columns to generations table
-- Run this if you have an existing database

ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS width_cm numeric(10, 2),
ADD COLUMN IF NOT EXISTS height_cm numeric(10, 2),
ADD COLUMN IF NOT EXISTS depth_cm numeric(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN public.generations.width_cm IS 'Width in centimeters';
COMMENT ON COLUMN public.generations.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN public.generations.depth_cm IS 'Depth in centimeters';
