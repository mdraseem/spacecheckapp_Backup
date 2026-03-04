-- Shopify Integration Tables
-- Run this migration to add Shopify store connections and sync tracking

-- Table: shopify_stores
-- Stores the OAuth connection between a SpaceCheck user and their Shopify store
CREATE TABLE IF NOT EXISTS shopify_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_domain)
);

-- Enable RLS
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Users can read their own store connections
CREATE POLICY "Users can view own shopify stores"
  ON shopify_stores FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own store connections
CREATE POLICY "Users can insert own shopify stores"
  ON shopify_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own store connections
CREATE POLICY "Users can delete own shopify stores"
  ON shopify_stores FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_shopify_stores_user_id ON shopify_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_shop_domain ON shopify_stores(shop_domain);


-- Table: shopify_syncs
-- Tracks which generations have been pushed to which Shopify products
CREATE TABLE IF NOT EXISTS shopify_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  shopify_product_id TEXT NOT NULL,
  shopify_media_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'uploading', 'processing', 'completed', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shopify_syncs ENABLE ROW LEVEL SECURITY;

-- Users can view syncs for their own generations
CREATE POLICY "Users can view own shopify syncs"
  ON shopify_syncs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generations
      WHERE generations.id = shopify_syncs.generation_id
      AND generations.user_id = auth.uid()
    )
  );

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_shopify_syncs_generation_id ON shopify_syncs(generation_id);
CREATE INDEX IF NOT EXISTS idx_shopify_syncs_shop_domain ON shopify_syncs(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_syncs_status ON shopify_syncs(sync_status);
